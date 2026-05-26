#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: converter.py
# 作者: wuhao
# 日期: 2026_05_26_20:42:13
# 描述: 常见文件转换和压缩工具接口, 支持 Markdown 转 PDF、图片压缩及 ZIP 打包

from __future__ import annotations

import asyncio
import base64
import mimetypes
import re
import uuid
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Annotated

import markdown
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from PIL import Image
from pydantic import BaseModel, Field
from loguru import logger

from api.deps import CurrentUser
from infrastructure.storage.s3_storage import S3StorageService

router = APIRouter()


class PDFGenerator:
    """
    PDF 生成器类, 使用 Playwright 将 HTML 转换为 PDF, 支持 Mermaid 图表和 KaTeX 公式渲染
    """

    def __init__(self) -> None:
        """
        初始化 PDF 生成器并检查 Playwright 环境
        """
        self._playwright_available = False
        self._init_backend()

    def _init_backend(self) -> None:
        """
        初始化 Playwright 引擎
        """
        try:
            from playwright.sync_api import sync_playwright  # noqa: F401

            self._playwright_available = True
            logger.info("Playwright 已启用")
        except ImportError:
            logger.warning("Playwright 未安装")

    async def generate_pdf(self, html_content: str) -> bytes:
        """
        将 HTML 内容转换为 PDF 字节流
        
        参数:
            html_content (str): 待转换的 HTML 字符串
        返回值:
            bytes: 生成的 PDF 数据
        异常:
            RuntimeError: Playwright 未安装或环境不可用时抛出
        """
        if not self._playwright_available:
            raise RuntimeError("Playwright 未安装. 请执行: pip install playwright && playwright install chromium")
        return await self._generate_with_playwright(html_content)

    async def _generate_with_playwright(self, html_content: str) -> bytes:
        """
        使用 Playwright 同步 API 在后台线程中生成 PDF
        """
        from playwright.sync_api import sync_playwright

        backend_dir = Path(__file__).resolve().parents[3]
        vendor_dir = backend_dir / "assets" / "pdf_vendor"

        def _pick_vendor_file(name: str) -> Path:
            preferred = vendor_dir / name
            if preferred.exists():
                return preferred
            fallback = backend_dir / name
            return fallback

        mermaid_js_path = _pick_vendor_file("mermaid.min.js")
        katex_js_path = _pick_vendor_file("katex.min.js")
        katex_css_path = _pick_vendor_file("katex.min.css")
        auto_render_js_path = _pick_vendor_file("auto-render.min.js")

        def _generate():
            with sync_playwright() as p:
                try:
                    browser = p.chromium.launch()
                except Exception as e:
                    raise RuntimeError("Playwright Chromium 不可用, 请先执行: playwright install chromium") from e
                page = browser.new_page()

                # 设置内容并等待加载
                page.set_content(html_content, wait_until="domcontentloaded", timeout=60000)

                if katex_css_path.exists():
                    page.add_style_tag(path=str(katex_css_path))
                else:
                    logger.warning(f"KaTeX CSS 不存在: {katex_css_path}")

                if mermaid_js_path.exists():
                    page.add_script_tag(path=str(mermaid_js_path))
                else:
                    logger.warning(f"Mermaid JS 不存在: {mermaid_js_path}")

                if katex_js_path.exists():
                    page.add_script_tag(path=str(katex_js_path))
                else:
                    logger.warning(f"KaTeX JS 不存在: {katex_js_path}")

                if auto_render_js_path.exists():
                    page.add_script_tag(path=str(auto_render_js_path))
                else:
                    logger.warning(f"KaTeX auto-render JS 不存在: {auto_render_js_path}")

                page.evaluate(
                    """() => {
                      try {
                        if (window.mermaid) {
                          window.mermaid.initialize({
                            startOnLoad: false,
                            theme: 'default',
                            flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
                          });
                          window.mermaid.run();
                        }
                      } catch (e) {}

                      try {
                        if (window.renderMathInElement) {
                          window.renderMathInElement(document.body, {
                            delimiters: [
                              { left: '$$', right: '$$', display: true },
                              { left: '$', right: '$', display: false },
                            ],
                            throwOnError: false,
                          });
                        }
                      } catch (e) {}
                    }"""
                )

                # 等待 Mermaid 渲染完成
                try:
                    has_mermaid = page.evaluate("() => !!document.querySelector('.mermaid')")
                    if has_mermaid:
                        page.wait_for_selector(".mermaid svg", timeout=8000)
                        logger.info("Mermaid 渲染完成")
                except Exception as e:
                    logger.warning(f"Mermaid 渲染超时或未找到: {e}")

                # 额外等待确保渲染完成
                page.wait_for_timeout(1500)

                pdf_bytes = page.pdf(
                    format="A4", margin={"top": "20px", "right": "20px", "bottom": "20px", "left": "20px"}
                )
                browser.close()
                return pdf_bytes

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _generate)


# 全局 PDF 生成器实例
_pdf_generator = PDFGenerator()


class ToolResultResponse(BaseModel):
    """工具处理结果响应模型"""

    url: str = Field(description="处理后的文件下载链接 (预签名 URL)")
    expires_in: int = Field(description="链接过期时间 (秒)")
    file_name: str = Field(description="文件名")
    message: str = Field(default="处理成功", description="提示信息")
    original_size: int | None = Field(default=None, description="原始文件大小(字节)")
    converted_size: int | None = Field(default=None, description="转换后文件大小(字节)")
    original_width: int | None = Field(default=None, description="原图宽度")
    original_height: int | None = Field(default=None, description="原图高度")
    converted_width: int | None = Field(default=None, description="转换后宽度")
    converted_height: int | None = Field(default=None, description="转换后高度")


class ToolsUtils:
    """转换工具内部辅助函数类"""

    @staticmethod
    def convert_images_to_base64(html_text: str, base_path: Path) -> str:
        """将 HTML 中的本地图片路径转换为 base64 编码"""
        img_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'

        def replace_image(match: re.Match) -> str:
            img_tag = match.group(0)
            src = match.group(1)
            if src.startswith(("data:", "http://", "https://")):
                return img_tag
            if ".." in src or "\\" in src:
                return img_tag
            if src.startswith("/"):
                img_path = Path(src.lstrip("/"))
            else:
                img_path = base_path / src
            try:
                resolved_path = img_path.resolve()
                if img_path.exists():
                    with open(resolved_path, "rb") as f:
                        img_data = f.read()
                    mime_type, _ = mimetypes.guess_type(str(resolved_path)) or ("image/png", None)
                    base64_data = base64.b64encode(img_data).decode("utf-8")
                    return img_tag.replace(src, f"data:{mime_type};base64,{base64_data}")
                return img_tag
            except Exception as e:
                logger.warning(f"转换图片失败 {src}: {e}")
                return img_tag

        return re.sub(img_pattern, replace_image, html_text)

    @staticmethod
    def process_mermaid_blocks(md_text: str) -> tuple[str, list[str]]:
        """提取 Mermaid 代码块并在 Markdown 中替换为占位符"""
        mermaid_blocks: list[str] = []
        normalized = md_text.replace("\r\n", "\n").replace("\r", "\n")
        lines = normalized.split("\n")
        open_re = re.compile(r"^[ \t]*```+[ \t]*mermaid[ \t]*$", flags=re.IGNORECASE)
        close_re = re.compile(r"^[ \t]*```+[ \t]*$", flags=0)
        out_lines: list[str] = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if open_re.match(line):
                i += 1
                block_lines: list[str] = []
                while i < len(lines) and not close_re.match(lines[i]):
                    block_lines.append(lines[i])
                    i += 1
                if i >= len(lines):
                    out_lines.append(line)
                    out_lines.extend(block_lines)
                    break
                code = "\n".join(block_lines).strip()
                mermaid_blocks.append(code)
                out_lines.append(f'<div data-mermaid-placeholder="{len(mermaid_blocks) - 1}"></div>')
                i += 1
                continue
            out_lines.append(line)
            i += 1
        return "\n".join(out_lines), mermaid_blocks

    @staticmethod
    def restore_mermaid_blocks(html_text: str, mermaid_blocks: list[str]) -> str:
        """将占位符替换为 Mermaid div"""
        for i, code in enumerate(mermaid_blocks):
            placeholder = f'<div data-mermaid-placeholder="{i}"></div>'
            mermaid_div = f'<div class="mermaid">\n{code}\n</div>'
            html_text = html_text.replace(placeholder, mermaid_div)
        return html_text

    @staticmethod
    def process_math_blocks(md_text: str) -> tuple[str, list[dict[str, str]]]:
        """提取数学公式块并在 Markdown 中替换为占位符"""
        math_blocks: list[dict[str, str]] = []
        display_pattern = r"\$\$([\s\S]*?)\$\$"
        def _replace_display(match: re.Match) -> str:
            math_blocks.append({"kind": "block", "text": f"$${match.group(1)}$$"})
            return f'<div data-math-placeholder="{len(math_blocks) - 1}"></div>'
        processed = re.sub(display_pattern, _replace_display, md_text, flags=re.DOTALL)
        inline_pattern = r"(?<!\\)\$(?!\$)([^\n]*?)(?<!\\)\$(?!\$)"
        def _replace_inline(match: re.Match) -> str:
            math_blocks.append({"kind": "inline", "text": f"${match.group(1)}$"})
            return f'<span data-math-placeholder="{len(math_blocks) - 1}"></span>'
        return re.sub(inline_pattern, _replace_inline, processed), math_blocks

    @staticmethod
    def restore_math_blocks(html_text: str, math_blocks: list[dict[str, str]]) -> str:
        """恢复 HTML 中的数学公式占位符"""
        for i, item in enumerate(math_blocks):
            text = item["text"]
            html_text = html_text.replace(f'<div data-math-placeholder="{i}"></div>', text)
            html_text = html_text.replace(f'<span data-math-placeholder="{i}"></span>', text)
        return html_text


class ToolsAPI:
    """文件转换核心业务类"""

    @staticmethod
    async def convert_md_to_pdf(
        file: UploadFile,
        current_user: CurrentUser,
        s3_service: S3StorageService,
        base_dir: str = "",
    ) -> ToolResultResponse:
        """Markdown 转 PDF 逻辑实现"""
        if not file.filename or not file.filename.endswith(".md"):
            raise HTTPException(status_code=400, detail={"code": 400, "message": "只支持 .md 格式文件"})
        try:
            content = await file.read()
            md_text = content.decode("utf-8")
            md_without_mermaid, mermaid_blocks = ToolsUtils.process_mermaid_blocks(md_text)
            md_without_math, math_blocks = ToolsUtils.process_math_blocks(md_without_mermaid)
            html_text = markdown.markdown(md_without_math, extensions=["tables", "fenced_code"])
            html_text = ToolsUtils.restore_math_blocks(html_text, math_blocks)
            html_text = ToolsUtils.restore_mermaid_blocks(html_text, mermaid_blocks)
            base_path = Path(base_dir) if base_dir else Path(file.filename).parent
            html_with_images = ToolsUtils.convert_images_to_base64(html_text, base_path)
            html_with_font = f"<!DOCTYPE html><html><head><meta charset='UTF-8'><style>body {{ font-family: sans-serif; font-size: 14px; padding: 20px; }} pre, code {{ background-color: #f5f5f5; border-radius: 4px; }} table {{ border-collapse: collapse; width: 100%; }} th, td {{ border: 1px solid #ddd; padding: 8px; }} img {{ max-width: 100%; height: auto; }} .mermaid {{ text-align: center; margin: 20px 0; }}</style></head><body>{html_with_images}</body></html>"
            pdf_bytes = await _pdf_generator.generate_pdf(html_with_font)
            if not pdf_bytes: raise ValueError("PDF 生成为空")
            object_key = f"tools/pdf/{current_user['user_id']}/{uuid.uuid4().hex}.pdf"
            s3_service.upload_bytes(pdf_bytes, object_key, content_type="application/pdf")
            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)
            return ToolResultResponse(url=presigned_url, expires_in=300, file_name=file.filename.replace(".md", ".pdf"), original_size=len(content), converted_size=len(pdf_bytes))
        except Exception as e:
            logger.error(f"MD转PDF失败: {e}")
            raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

    @staticmethod
    async def compress_image(
        file: UploadFile,
        quality: int,
        current_user: CurrentUser,
        s3_service: S3StorageService,
        target_size_kb: int | None = None,
    ) -> ToolResultResponse:
        """图片压缩逻辑实现"""
        try:
            content = await file.read()
            image = Image.open(BytesIO(content))
            if image.mode in ("RGBA", "P"): image = image.convert("RGB")
            output_buffer = BytesIO()
            image.save(output_buffer, format="JPEG", quality=quality)
            compressed_bytes = output_buffer.getvalue()
            object_key = f"tools/images/{current_user['user_id']}/{uuid.uuid4().hex}.jpg"
            s3_service.upload_bytes(compressed_bytes, object_key, content_type="image/jpeg")
            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)
            return ToolResultResponse(url=presigned_url, expires_in=300, file_name=f"compressed_{file.filename}", original_size=len(content), converted_size=len(compressed_bytes))
        except Exception as e:
            logger.error(f"图片压缩失败: {e}")
            raise HTTPException(status_code=500, detail={"code": 500, "message": "图片压缩失败"})

    @staticmethod
    async def compress_files_to_zip(
        files: list[UploadFile],
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """多文件 ZIP 压缩逻辑实现"""
        try:
            zip_buffer = BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for file in files:
                    zip_file.writestr(file.filename or "file", await file.read())
            zip_bytes = zip_buffer.getvalue()
            object_key = f"tools/zip/{current_user['user_id']}/{uuid.uuid4().hex}.zip"
            s3_service.upload_bytes(zip_bytes, object_key, content_type="application/zip")
            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)
            return ToolResultResponse(url=presigned_url, expires_in=300, file_name="archive.zip", converted_size=len(zip_bytes))
        except Exception as e:
            logger.error(f"ZIP 压缩失败: {e}")
            raise HTTPException(status_code=500, detail={"code": 500, "message": "ZIP 压缩失败"})


class ToolsRouter:
    """转换工具 API 路由处理器"""

    @staticmethod
    @router.post("/md_to_pdf", response_model=ToolResultResponse, tags=["工具"], summary="Markdown 转 PDF")
    async def md_to_pdf(
        current_user: CurrentUser,
        file: UploadFile = File(...),
        base_dir: str = Form("", description="Markdown 基础目录"),
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        return await ToolsAPI.convert_md_to_pdf(file, current_user, s3_service, base_dir)

    @staticmethod
    @router.post("/compress_image", response_model=ToolResultResponse, tags=["工具"], summary="压缩图片")
    async def compress_image(
        current_user: CurrentUser,
        file: UploadFile = File(...),
        quality: int = Form(60, description="质量 1-100"),
        target_size_kb: Annotated[int | None, Form(description="目标大小KB")] = None,
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        return await ToolsAPI.compress_image(file, quality, current_user, s3_service, target_size_kb)

    @staticmethod
    @router.post("/compress_zip", response_model=ToolResultResponse, tags=["工具"], summary="打包 ZIP")
    async def compress_zip(
        current_user: CurrentUser,
        files: list[UploadFile] = File(...),
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        return await ToolsAPI.compress_files_to_zip(files, current_user, s3_service)


__all__ = ["ToolsRouter", "router"]
