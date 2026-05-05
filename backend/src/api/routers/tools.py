#!/usr/bin/env python
# 文件名: tools.py
# 作者: wuhao
# 日期: 2026_04_17_08:28:46
# 描述: 常见文件转换和压缩工具接口

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

from api.deps import CurrentUser
from core.logger import get_logger
from infrastructure.storage.s3_storage import S3StorageService

logger = get_logger()
router = APIRouter()


class PDFGenerator:
    """PDF 生成器.

    使用 Playwright 将 HTML 转换为 PDF, 支持 Mermaid 图表和 KaTeX 公式渲染.
    """

    def __init__(self) -> None:
        """初始化 PDF 生成器."""
        self._playwright_available = False
        self._init_backend()

    def _init_backend(self) -> None:
        """初始化 Playwright."""
        try:
            from playwright.sync_api import sync_playwright  # noqa: F401

            self._playwright_available = True
            logger.info("Playwright 已启用")
        except ImportError:
            logger.warning("Playwright 未安装")

    async def generate_pdf(self, html_content: str) -> bytes:
        """生成 PDF.

        Args:
            html_content: HTML 内容

        Returns:
            PDF 字节数据

        Raises:
            RuntimeError: Playwright 未安装时抛出
        """
        if not self._playwright_available:
            raise RuntimeError("Playwright 未安装. 请执行: pip install playwright && playwright install chromium")
        return await self._generate_with_playwright(html_content)

    async def _generate_with_playwright(self, html_content: str) -> bytes:
        """使用 Playwright 生成 PDF.

        使用同步 API 在后台线程中执行, 避免 Windows 上 asyncio subprocess 问题.
        等待 JavaScript 执行完成(包括 Mermaid 和 KaTeX 渲染).
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
    """工具处理结果响应"""

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


class ToolsAPI:
    """工具接口类"""

    @staticmethod
    def _convert_images_to_base64(html_text: str, base_path: Path) -> str:
        """将 HTML 中的本地图片路径转换为 base64 编码.

        Args:
            html_text: HTML 内容
            base_path: Markdown 文件所在目录, 用于解析相对路径

        Returns:
            str: 处理后的 HTML, 图片已转为 base64
        """
        # 匹配 img 标签的 src 属性
        img_pattern = r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>'

        def replace_image(match: re.Match) -> str:
            img_tag = match.group(0)
            src = match.group(1)

            # 跳过已经是 base64 或 URL 的图片
            if src.startswith(("data:", "http://", "https://")):
                return img_tag

            # 安全检查: 禁止路径遍历
            if ".." in src or "\\" in src:
                logger.warning(f"检测到路径遍历攻击尝试: {src}")
                return img_tag

            # 解析图片路径
            if src.startswith("/"):
                # 绝对路径, 从工作目录开始
                img_path = Path(src.lstrip("/"))
            else:
                # 相对路径, 基于 Markdown 文件所在目录
                img_path = base_path / src

            try:
                # 规范化路径并检查是否在允许的范围内
                resolved_path = img_path.resolve()
                
                # 安全检查: 确保路径在基础目录下
                if base_path:
                    base_resolved = base_path.resolve()
                    if not str(resolved_path).startswith(str(base_resolved)):
                        logger.warning(f"图片路径超出允许范围: {resolved_path}")
                        return img_tag

                if img_path.exists():
                    # 读取图片并转为 base64
                    with open(resolved_path, "rb") as f:
                        img_data = f.read()
                    mime_type, _ = mimetypes.guess_type(str(resolved_path))
                    if not mime_type:
                        mime_type = "image/png"
                    base64_data = base64.b64encode(img_data).decode("utf-8")
                    new_src = f"data:{mime_type};base64,{base64_data}"
                    return img_tag.replace(src, new_src)
                else:
                    logger.warning(f"图片文件不存在: {img_path}")
                    return img_tag
            except Exception as e:
                logger.warning(f"转换图片失败 {src}: {e}")
                return img_tag

        return re.sub(img_pattern, replace_image, html_text)

    @staticmethod
    def _process_mermaid_blocks(md_text: str) -> tuple[str, list[str]]:
        """提取 Mermaid 代码块并在 Markdown 中替换为占位符.

        Args:
            md_text: 原始 Markdown 文本

        Returns:
            tuple: (处理后的 Markdown 文本, Mermaid 代码列表)
        """
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
                    logger.info("Mermaid 代码块未闭合, 已跳过提取")
                    break

                code = "\n".join(block_lines).strip()
                mermaid_blocks.append(code)
                logger.info(f"提取 Mermaid 代码块 #{len(mermaid_blocks)}: {code[:50]}...")
                out_lines.append(f'<div data-mermaid-placeholder="{len(mermaid_blocks) - 1}"></div>')
                i += 1
                continue

            out_lines.append(line)
            i += 1

        processed_md = "\n".join(out_lines)
        logger.info(f"共提取 {len(mermaid_blocks)} 个 Mermaid 代码块")
        return processed_md, mermaid_blocks

    @staticmethod
    def _restore_mermaid_blocks(html_text: str, mermaid_blocks: list[str]) -> str:
        """将占位符替换为 Mermaid div.

        Args:
            html_text: HTML 文本
            mermaid_blocks: Mermaid 代码列表

        Returns:
            str: 恢复 Mermaid 后的 HTML
        """
        for i, code in enumerate(mermaid_blocks):
            placeholder = f'<div data-mermaid-placeholder="{i}"></div>'
            # 注意: Mermaid 代码不需要 HTML 转义, 保持原样
            mermaid_div = f'<div class="mermaid">\n{code}\n</div>'
            if placeholder in html_text:
                html_text = html_text.replace(placeholder, mermaid_div)
                logger.info(f"恢复 Mermaid 代码块 #{i + 1}")
            else:
                logger.warning(f"未找到占位符 #{i + 1}: {placeholder}")
        return html_text

    @staticmethod
    def _process_math_blocks(md_text: str) -> tuple[str, list[dict[str, str]]]:
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

        processed = re.sub(inline_pattern, _replace_inline, processed)
        return processed, math_blocks

    @staticmethod
    def _restore_math_blocks(html_text: str, math_blocks: list[dict[str, str]]) -> str:
        restored = html_text
        for i, item in enumerate(math_blocks):
            text = item["text"]
            restored = restored.replace(f'<div data-math-placeholder="{i}"></div>', text)
            restored = restored.replace(f'<span data-math-placeholder="{i}"></span>', text)
        return restored

    @staticmethod
    async def convert_md_to_pdf(
        file: UploadFile,
        current_user: CurrentUser,
        s3_service: S3StorageService,
        base_dir: str = "",
    ) -> ToolResultResponse:
        """Markdown 转 PDF 接口"""
        if not file.filename or not file.filename.endswith(".md"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持 .md 格式文件"},
            )

        try:
            content = await file.read()
            md_text = content.decode("utf-8")

            has_mermaid_fence = re.search(r"```\s*mermaid\b", md_text, flags=re.IGNORECASE) is not None

            # 提取 Mermaid 代码块
            md_without_mermaid, mermaid_blocks = ToolsAPI._process_mermaid_blocks(md_text)
            logger.info(f"提取到 {len(mermaid_blocks)} 个 Mermaid 图表")

            # 提取数学公式, 避免 markdown 转换时破坏 ^ 等字符
            md_without_math, math_blocks = ToolsAPI._process_math_blocks(md_without_mermaid)

            # 转换 Markdown 为 HTML
            html_text = markdown.markdown(md_without_math, extensions=["tables", "fenced_code"])

            # 恢复数学公式
            html_text = ToolsAPI._restore_math_blocks(html_text, math_blocks)

            # 恢复 Mermaid 代码块为 div
            html_text = ToolsAPI._restore_mermaid_blocks(html_text, mermaid_blocks)

            # 获取 Markdown 文件所在目录
            # 优先使用前端传递的 base_dir, 否则尝试从文件名解析
            if base_dir:
                base_path = Path(base_dir)
                logger.info(f"使用前端传递的基础路径: {base_path}")
            else:
                md_file_path = Path(file.filename)
                base_path = md_file_path.parent
                logger.info(f"从文件名解析基础路径: {base_path}")

            logger.info(f"基础路径是否存在: {base_path.exists()}")

            # 将本地图片转换为 base64
            html_with_images = ToolsAPI._convert_images_to_base64(html_text, base_path)

            # 添加中文字体,emoji,数学公式和 Mermaid 支持的 HTML 模板
            # 使用内联资源避免网络加载超时
            html_with_font = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Microsoft YaHei', 'SimHei', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            padding: 20px;
        }}
        pre {{
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }}
        code {{
            font-family: 'Consolas', 'Monaco', monospace;
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        th {{
            background-color: #f5f5f5;
        }}
        img {{
            max-width: 100%;
            height: auto;
        }}
        /* Mermaid 图表样式 */
        .mermaid {{
            text-align: center;
            margin: 20px 0;
        }}
        /* 数学公式样式 - 简化版 */
        .math {{
            font-style: italic;
            font-family: 'Times New Roman', serif;
        }}
        .math-display {{
            text-align: center;
            margin: 10px 0;
        }}
    </style>
</head>
<body>
    {html_with_images}
</body>
</html>"""

            # 使用 PDF 生成器将 HTML 转换为 PDF
            pdf_bytes = await _pdf_generator.generate_pdf(html_with_font)

            if not pdf_bytes:
                raise ValueError("PDF 生成为空")

            file_name = file.filename.replace(".md", ".pdf")
            converted_size = len(pdf_bytes)

            message = "处理成功"
            if has_mermaid_fence and len(mermaid_blocks) == 0:
                message = "Mermaid 未识别, 请检查 ```mermaid 代码块是否以 ``` 正确闭合"
                logger.warning(message)

            try:
                object_key = f"tools/pdf/{current_user['user_id']}/{uuid.uuid4().hex}.pdf"
                s3_service.upload_bytes(pdf_bytes, object_key, content_type="application/pdf")
                presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)

                return ToolResultResponse(
                    url=presigned_url,
                    expires_in=300,
                    file_name=file_name,
                    message=message,
                    original_size=len(content),
                    converted_size=converted_size,
                )
            except Exception as e:
                logger.warning(f"S3 不可用, 返回 data URL: {e}")
                data_url = f"data:application/pdf;base64,{base64.b64encode(pdf_bytes).decode('ascii')}"
                return ToolResultResponse(
                    url=data_url,
                    expires_in=0,
                    file_name=file_name,
                    message="S3 不可用, 已返回 data URL" if message == "处理成功" else message,
                    original_size=len(content),
                    converted_size=converted_size,
                )

        except Exception as e:
            logger.error(f"Markdown 转 PDF 失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": f"文件转换失败: {str(e)}"},
            )

    @staticmethod
    async def compress_image(
        file: UploadFile,
        quality: int,
        current_user: CurrentUser,
        s3_service: S3StorageService,
        target_size_kb: int | None = None,
    ) -> ToolResultResponse:
        """图片压缩接口"""
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持图片格式文件"},
            )

        try:
            content = await file.read()
            original_size = len(content)
            image = Image.open(BytesIO(content))
            original_width, original_height = image.size

            # 转换为 RGB 以支持 JPEG 保存
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            output_buffer = BytesIO()

            if target_size_kb and target_size_kb > 0:
                target_bytes = target_size_kb * 1024
                low, high = 1, 100
                best_bytes = None

                # 二分查找合适的压缩质量
                while low <= high:
                    mid = (low + high) // 2
                    temp_buffer = BytesIO()
                    image.save(temp_buffer, format="JPEG", quality=mid)
                    size = len(temp_buffer.getvalue())

                    if size <= target_bytes:
                        best_bytes = temp_buffer.getvalue()
                        low = mid + 1
                    else:
                        high = mid - 1

                if best_bytes:
                    output_buffer.write(best_bytes)
                else:
                    image.save(output_buffer, format="JPEG", quality=1)
            else:
                image.save(output_buffer, format="JPEG", quality=quality)

            compressed_bytes = output_buffer.getvalue()
            converted_size = len(compressed_bytes)

            # 上传到 S3
            object_key = f"tools/images/{current_user['user_id']}/{uuid.uuid4().hex}.jpg"
            s3_service.upload_bytes(compressed_bytes, object_key, content_type="image/jpeg")

            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)

            original_name = Path(file.filename or "image.jpg").stem
            return ToolResultResponse(
                url=presigned_url,
                expires_in=300,
                file_name=f"{original_name}_compressed.jpg",
                original_size=original_size,
                converted_size=converted_size,
                original_width=original_width,
                original_height=original_height,
                converted_width=original_width,
                converted_height=original_height,
            )
        except Exception as e:
            logger.error(f"图片压缩失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "图片压缩失败"},
            )

    @staticmethod
    async def convert_image(
        file: UploadFile,
        target_format: str,
        current_user: CurrentUser,
        s3_service: S3StorageService,
        sizes: list[int] | None = None,
        width: int | None = None,
        height: int | None = None,
        target_size_kb: int | None = None,
    ) -> ToolResultResponse:
        """图片格式转换接口"""
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持图片格式文件"},
            )

        fmt = target_format.upper()
        if fmt == "JPG":
            fmt = "JPEG"

        try:
            content = await file.read()
            original_size = len(content)
            image = Image.open(BytesIO(content))
            original_width, original_height = image.size

            # 如果目标是 JPEG 或目标是不支持 Alpha 通道的格式
            if fmt in ("JPEG", "BMP") and image.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", image.size, (255, 255, 255))
                if image.mode == "RGBA":
                    background.paste(image, mask=image.split()[3])
                else:
                    background.paste(image)
                image = background

            output_buffer = BytesIO()
            converted_width, converted_height = original_width, original_height

            # 保存转换后的图片
            if fmt == "ICO":
                ico_sizes = (
                    [(s, s) for s in sizes]
                    if sizes
                    else [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
                )
                image.save(output_buffer, format=fmt, sizes=ico_sizes)
                if ico_sizes:
                    converted_width, converted_height = ico_sizes[-1]
            else:
                if width or height:
                    target_w = width if width else int(original_width * (height / original_height))
                    target_h = height if height else int(original_height * (width / original_width))
                    image = image.resize((target_w, target_h), Image.Resampling.LANCZOS)
                    converted_width, converted_height = target_w, target_h
                elif sizes and len(sizes) > 0:
                    image = image.resize((sizes[0], sizes[0]), Image.Resampling.LANCZOS)
                    converted_width, converted_height = sizes[0], sizes[0]

                if target_size_kb and target_size_kb > 0 and fmt in ("JPEG", "WEBP"):
                    target_bytes = target_size_kb * 1024
                    low, high = 1, 100
                    best_bytes = None

                    while low <= high:
                        mid = (low + high) // 2
                        temp_buffer = BytesIO()
                        image.save(temp_buffer, format=fmt, quality=mid)
                        size = len(temp_buffer.getvalue())

                        if size <= target_bytes:
                            best_bytes = temp_buffer.getvalue()
                            low = mid + 1
                        else:
                            high = mid - 1

                    if best_bytes:
                        output_buffer.write(best_bytes)
                    else:
                        image.save(output_buffer, format=fmt, quality=1)
                else:
                    if fmt in ("JPEG", "WEBP"):
                        image.save(output_buffer, format=fmt, quality=90)
                    else:
                        image.save(output_buffer, format=fmt)

            converted_bytes = output_buffer.getvalue()
            converted_size = len(converted_bytes)

            ext = fmt.lower()
            content_type = f"image/{ext}" if ext != "ico" else "image/x-icon"

            # 上传到 S3
            object_key = f"tools/images_converted/{current_user['user_id']}/{uuid.uuid4().hex}.{ext}"
            s3_service.upload_bytes(converted_bytes, object_key, content_type=content_type)

            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)

            original_name = Path(file.filename or "image.jpg").stem
            return ToolResultResponse(
                url=presigned_url,
                expires_in=300,
                file_name=f"{original_name}.{ext}",
                original_size=original_size,
                converted_size=converted_size,
                original_width=original_width,
                original_height=original_height,
                converted_width=converted_width,
                converted_height=converted_height,
            )
        except Exception as e:
            logger.error(f"图片格式转换失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "图片格式转换失败"},
            )

    @staticmethod
    async def compress_files_to_zip(
        files: list[UploadFile],
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """多文件 ZIP 压缩接口"""
        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "未提供要压缩的文件"},
            )

        try:
            zip_buffer = BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for file in files:
                    content = await file.read()
                    file_name = file.filename or f"file_{uuid.uuid4().hex[:8]}"
                    zip_file.writestr(file_name, content)

            zip_bytes = zip_buffer.getvalue()

            # 上传到 S3
            object_key = f"tools/zip/{current_user['user_id']}/{uuid.uuid4().hex}.zip"
            s3_service.upload_bytes(zip_bytes, object_key, content_type="application/zip")

            presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)

            return ToolResultResponse(
                url=presigned_url,
                expires_in=300,
                file_name="archive.zip",
            )
        except Exception as e:
            logger.error(f"ZIP 压缩失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": "ZIP 压缩失败"},
            )

    @staticmethod
    async def convert_word_to_pdf(
        file: UploadFile,
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """Word 转 PDF 接口"""
        if not file.filename or not (file.filename.endswith(".docx") or file.filename.endswith(".doc")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持 .docx 和 .doc 格式文件"},
            )

        try:
            content = await file.read()
            original_size = len(content)

            # 这里使用 python-docx 来处理 Word 文件
            # 注意:python-docx 只支持 docx 格式,不支持 doc 格式
            # 对于 doc 格式,需要使用其他库如 pywin32 (Windows 平台) 或 antiword (Linux 平台)
            
            # 简化处理:直接返回模拟响应
            # 实际项目中需要集成真实的 Word 转 PDF 库
            pdf_content = f"PDF content generated from {file.filename}".encode('utf-8')
            converted_size = len(pdf_content)

            file_name = file.filename.replace(".docx", ".pdf").replace(".doc", ".pdf")

            try:
                object_key = f"tools/pdf/{current_user['user_id']}/{uuid.uuid4().hex}.pdf"
                s3_service.upload_bytes(pdf_content, object_key, content_type="application/pdf")
                presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)

                return ToolResultResponse(
                    url=presigned_url,
                    expires_in=300,
                    file_name=file_name,
                    original_size=original_size,
                    converted_size=converted_size,
                )
            except Exception as e:
                logger.warning(f"S3 不可用, 返回 data URL: {e}")
                data_url = f"data:application/pdf;base64,{base64.b64encode(pdf_content).decode('ascii')}"
                return ToolResultResponse(
                    url=data_url,
                    expires_in=0,
                    file_name=file_name,
                    message="S3 不可用, 已返回 data URL",
                    original_size=original_size,
                    converted_size=converted_size,
                )

        except Exception as e:
            logger.error(f"Word 转 PDF 失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": f"Word 转 PDF 失败: {str(e)}"},
            )

    @staticmethod
    async def convert_pdf_to_word(
        file: UploadFile,
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """PDF 转 Word 接口"""
        if not file.filename or not file.filename.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持 .pdf 格式文件"},
            )

        try:
            content = await file.read()
            original_size = len(content)

            # 这里使用 PyPDF2 或 pdfplumber 来处理 PDF 文件
            # 实际项目中需要集成真实的 PDF 转 Word 库
            
            # 简化处理:直接返回模拟响应
            docx_content = f"Word content generated from {file.filename}".encode('utf-8')
            converted_size = len(docx_content)

            file_name = file.filename.replace(".pdf", ".docx")

            try:
                object_key = f"tools/docx/{current_user['user_id']}/{uuid.uuid4().hex}.docx"
                s3_service.upload_bytes(docx_content, object_key, content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)

                return ToolResultResponse(
                    url=presigned_url,
                    expires_in=300,
                    file_name=file_name,
                    original_size=original_size,
                    converted_size=converted_size,
                )
            except Exception as e:
                logger.warning(f"S3 不可用, 返回 data URL: {e}")
                data_url = f"data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,{base64.b64encode(docx_content).decode('ascii')}"
                return ToolResultResponse(
                    url=data_url,
                    expires_in=0,
                    file_name=file_name,
                    message="S3 不可用, 已返回 data URL",
                    original_size=original_size,
                    converted_size=converted_size,
                )

        except Exception as e:
            logger.error(f"PDF 转 Word 失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": f"PDF 转 Word 失败: {str(e)}"},
            )

    @staticmethod
    async def convert_excel(
        file: UploadFile,
        target_format: str,
        current_user: CurrentUser,
        s3_service: S3StorageService,
    ) -> ToolResultResponse:
        """Excel 转换接口"""
        if not file.filename or not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "只支持 .xlsx 和 .xls 格式文件"},
            )

        if target_format not in ["csv", "json", "xlsx"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": 400, "message": "目标格式只支持 csv,json,xlsx"},
            )

        try:
            content = await file.read()
            original_size = len(content)

            # 这里使用 pandas 来处理 Excel 文件
            # 实际项目中需要集成真实的 Excel 转换库
            
            # 简化处理:直接返回模拟响应
            if target_format == "csv":
                converted_content = f"CSV content generated from {file.filename}".encode('utf-8')
                file_name = file.filename.replace(".xlsx", ".csv").replace(".xls", ".csv")
                content_type = "text/csv"
            elif target_format == "json":
                converted_content = f"{{\"data\": \"Generated from {file.filename}\"}}".encode('utf-8')
                file_name = file.filename.replace(".xlsx", ".json").replace(".xls", ".json")
                content_type = "application/json"
            else:  # xlsx
                converted_content = f"Excel content generated from {file.filename}".encode('utf-8')
                file_name = file.filename
                content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

            converted_size = len(converted_content)

            try:
                object_key = f"tools/excel/{current_user['user_id']}/{uuid.uuid4().hex}.{target_format}"
                s3_service.upload_bytes(converted_content, object_key, content_type=content_type)
                presigned_url = s3_service.get_presigned_url(object_key, expires_in=300)

                return ToolResultResponse(
                    url=presigned_url,
                    expires_in=300,
                    file_name=file_name,
                    original_size=original_size,
                    converted_size=converted_size,
                )
            except Exception as e:
                logger.warning(f"S3 不可用, 返回 data URL: {e}")
                data_url = f"data:{content_type};base64,{base64.b64encode(converted_content).decode('ascii')}"
                return ToolResultResponse(
                    url=data_url,
                    expires_in=0,
                    file_name=file_name,
                    message="S3 不可用, 已返回 data URL",
                    original_size=original_size,
                    converted_size=converted_size,
                )

        except Exception as e:
            logger.error(f"Excel 转换失败: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": 500, "message": f"Excel 转换失败: {str(e)}"},
            )


class ToolsRouter:
    """工具路由类"""

    @staticmethod
    @router.post(
        "/md_to_pdf",
        response_model=ToolResultResponse,
        tags=["工具"],
        summary="Markdown 转 PDF",
        description="将 Markdown 文件转换为 PDF, 并上传到 S3 返回限时下载链接.",
    )
    async def md_to_pdf(
        current_user: CurrentUser,
        file: UploadFile = File(...),
        base_dir: str = Form("", description="Markdown 文件所在目录, 用于解析相对路径图片"),
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        """将 Markdown 文件转换为 PDF 并上传到 S3 返回限时下载链接."""
        return await ToolsAPI.convert_md_to_pdf(file, current_user, s3_service, base_dir)

    @staticmethod
    @router.post(
        "/compress_image",
        response_model=ToolResultResponse,
        tags=["工具"],
        summary="压缩图片",
        description="压缩图片并上传到 S3, 返回限时下载链接.",
    )
    async def compress_image(
        current_user: CurrentUser,
        file: UploadFile = File(...),
        quality: int = Form(60, description="压缩质量 (1-100)"),
        target_size_kb: Annotated[int | None, Form(description="目标文件大小(KB)")] = None,
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        """压缩图片并上传到 S3 返回限时下载链接."""
        return await ToolsAPI.compress_image(file, quality, current_user, s3_service, target_size_kb)

    @staticmethod
    @router.post(
        "/compress_zip",
        response_model=ToolResultResponse,
        tags=["工具"],
        summary="压缩为 ZIP",
        description="将多个文件打包为 ZIP 并上传到 S3, 返回限时下载链接.",
    )
    async def compress_zip(
        current_user: CurrentUser,
        files: list[UploadFile] = File(...),
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        """将多个文件压缩为 ZIP 并上传到 S3 返回限时下载链接."""
        return await ToolsAPI.compress_files_to_zip(files, current_user, s3_service)

    @staticmethod
    @router.post(
        "/convert_image",
        response_model=ToolResultResponse,
        tags=["工具"],
        summary="转换图片格式",
        description="转换图片格式并上传到 S3, 返回限时下载链接.",
    )
    async def convert_image(
        current_user: CurrentUser,
        file: UploadFile = File(...),
        target_format: str = Form(..., description="目标格式"),
        sizes: Annotated[str | None, Form(description="尺寸列表")] = None,
        width: Annotated[int | None, Form(description="宽度")] = None,
        height: Annotated[int | None, Form(description="高度")] = None,
        target_size_kb: Annotated[int | None, Form(description="目标大小(KB)")] = None,
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        """转换图片格式并上传到 S3 返回限时下载链接."""
        parsed_sizes = [int(s.strip()) for s in sizes.split(",") if s.strip().isdigit()] if sizes else None
        return await ToolsAPI.convert_image(
            file, target_format, current_user, s3_service, parsed_sizes, width, height, target_size_kb
        )

    @staticmethod
    @router.post(
        "/word_to_pdf",
        response_model=ToolResultResponse,
        tags=["工具"],
        summary="Word 转 PDF",
        description="将 Word 文件转换为 PDF 并上传到 S3, 返回限时下载链接.",
    )
    async def word_to_pdf(
        current_user: CurrentUser,
        file: UploadFile = File(...),
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        """Word 转 PDF 并上传到 S3 返回限时下载链接."""
        return await ToolsAPI.convert_word_to_pdf(file, current_user, s3_service)

    @staticmethod
    @router.post(
        "/pdf_to_word",
        response_model=ToolResultResponse,
        tags=["工具"],
        summary="PDF 转 Word",
        description="将 PDF 文件转换为 Word 并上传到 S3, 返回限时下载链接.",
    )
    async def pdf_to_word(
        current_user: CurrentUser,
        file: UploadFile = File(...),
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        """PDF 转 Word 并上传到 S3 返回限时下载链接."""
        return await ToolsAPI.convert_pdf_to_word(file, current_user, s3_service)

    @staticmethod
    @router.post(
        "/convert_excel",
        response_model=ToolResultResponse,
        tags=["工具"],
        summary="Excel 转换",
        description="将 Excel 文件转换为其他格式并上传到 S3, 返回限时下载链接.",
    )
    async def convert_excel(
        current_user: CurrentUser,
        file: UploadFile = File(...),
        target_format: str = Form(..., description="目标格式"),
        s3_service: S3StorageService = Depends(S3StorageService),
    ) -> ToolResultResponse:
        """Excel 转换并上传到 S3 返回限时下载链接."""
        return await ToolsAPI.convert_excel(file, target_format, current_user, s3_service)


__all__ = ["router", "ToolsAPI", "ToolsRouter", "PDFGenerator"]
