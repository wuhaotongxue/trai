#!/usr/bin/env python
# 文件名: exam_share_repository.py
# 作者: wuhao
# 日期: 2026_06_02_18:48:39
# 描述: 考试分享仓储, 负责将可分享考试与答卷落盘到本地 JSON 存储

from __future__ import annotations

import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from loguru import logger

from core.exceptions import FileOperationError, ResourceNotFoundError


class ExamShareFileRepository:
    """
    考试分享文件仓储.

    用途:
        基于本地 JSON 文件持久化已发布考试, 分享索引和考生答卷.
    参数:
        storage_root: 可选存储根目录, 默认读取环境变量或 backend/runtime/exam_share.
    返回值:
        None.
    异常:
        无.
    """

    def __init__(self, storage_root: str | Path | None = None) -> None:
        """
        初始化考试分享文件仓储.

        用途:
            解析存储根目录并确保目录结构存在.
        参数:
            storage_root: 可选存储根目录.
        返回值:
            None.
        异常:
            FileOperationError: 当目录创建失败时抛出.
        """
        self._storage_root = self._resolve_storage_root(storage_root=storage_root)
        self._ensure_directory(directory=self._storage_root)
        self._ensure_directory(directory=self._papers_directory())
        self._ensure_directory(directory=self._submissions_directory())

    def save_published_exam(self, exam_data: dict[str, Any]) -> None:
        """
        保存已发布考试.

        用途:
            将考试结构化数据写入 papers 目录, 并更新 share_token 到 exam_id 的索引.
        参数:
            exam_data: 已发布考试字典数据.
        返回值:
            None.
        异常:
            FileOperationError: 当考试数据写入失败时抛出.
        """
        exam_id = str(exam_data.get("exam_id", "")).strip()
        share_token = str(exam_data.get("share_token", "")).strip()
        if not exam_id or not share_token:
            raise FileOperationError(message="保存考试失败, 缺少 exam_id 或 share_token")
        self._write_json(file_path=self._paper_file(exam_id=exam_id), payload=exam_data)
        index_data = self._read_json(file_path=self._index_file(), default={})
        index_data[share_token] = exam_id
        self._write_json(file_path=self._index_file(), payload=index_data)
        logger.info(f"[考试分享仓储] 已保存考试 | exam_id={exam_id} | share_token={share_token}")

    def get_published_exam(self, share_token: str) -> dict[str, Any]:
        """
        按分享令牌获取已发布考试.

        用途:
            先通过索引获取 exam_id, 再读取对应考试数据.
        参数:
            share_token: 分享令牌.
        返回值:
            dict[str, Any]: 已发布考试字典数据.
        异常:
            ResourceNotFoundError: 当分享令牌不存在或考试文件丢失时抛出.
        """
        index_data = self._read_json(file_path=self._index_file(), default={})
        exam_id = str(index_data.get(share_token, "")).strip()
        if not exam_id:
            raise ResourceNotFoundError(message="分享考试不存在或已失效")
        paper_file = self._paper_file(exam_id=exam_id)
        if not paper_file.exists():
            raise ResourceNotFoundError(message="分享考试不存在或已失效")
        stored_data = self._read_json(file_path=paper_file, default={})
        if not isinstance(stored_data, dict):
            raise ResourceNotFoundError(message="分享考试数据已损坏")
        return stored_data

    def save_submission(self, submission_data: dict[str, Any]) -> None:
        """
        保存考生答卷.

        用途:
            将答卷 JSON 写入 submissions 目录, 供后续统计和同步使用.
        参数:
            submission_data: 答卷字典数据.
        返回值:
            None.
        异常:
            FileOperationError: 当答卷写入失败时抛出.
        """
        submission_id = str(submission_data.get("submission_id", "")).strip()
        if not submission_id:
            raise FileOperationError(message="保存答卷失败, submission_id 不能为空")
        self._write_json(
            file_path=self._submission_file(submission_id=submission_id),
            payload=submission_data,
        )
        logger.info(f"[考试分享仓储] 已保存答卷 | submission_id={submission_id}")

    def list_published_exams(self) -> list[dict[str, Any]]:
        """
        列出所有已发布考试.

        用途:
            遍历 papers 目录并返回已发布考试列表, 默认按创建时间倒序输出.
        参数:
            无.
        返回值:
            list[dict[str, Any]]: 已发布考试字典列表.
        异常:
            无.
        """
        published_exams: list[dict[str, Any]] = []
        for file_path in self._papers_directory().glob("*.json"):
            paper_data = self._read_json(file_path=file_path, default={})
            if isinstance(paper_data, dict):
                published_exams.append(paper_data)
        published_exams.sort(
            key=lambda item: str(item.get("created_at", "")),
            reverse=True,
        )
        return published_exams

    def get_submission(self, submission_id: str) -> dict[str, Any]:
        """
        按答卷 ID 获取单份答卷.

        用途:
            读取指定答卷 JSON 文件, 供后台答卷详情页使用.
        参数:
            submission_id: 答卷唯一 ID.
        返回值:
            dict[str, Any]: 单份答卷字典数据.
        异常:
            ResourceNotFoundError: 当答卷不存在或数据损坏时抛出.
        """
        submission_file = self._submission_file(submission_id=submission_id)
        if not submission_file.exists():
            raise ResourceNotFoundError(message="答卷不存在或已失效")
        stored_data = self._read_json(file_path=submission_file, default={})
        if not isinstance(stored_data, dict):
            raise ResourceNotFoundError(message="答卷数据已损坏")
        return stored_data

    def list_submissions_by_exam(self, exam_id: str) -> list[dict[str, Any]]:
        """
        列出某场考试的所有答卷.

        用途:
            遍历 submissions 目录, 筛选指定考试的答卷列表.
        参数:
            exam_id: 考试 ID.
        返回值:
            list[dict[str, Any]]: 答卷数据列表.
        异常:
            无.
        """
        submissions: list[dict[str, Any]] = []
        for file_path in sorted(self._submissions_directory().glob("*.json")):
            submission = self._read_json(file_path=file_path, default={})
            if str(submission.get("exam_id", "")).strip() == exam_id:
                submissions.append(submission)
        return submissions

    def _resolve_storage_root(self, storage_root: str | Path | None) -> Path:
        """
        解析存储根目录.

        用途:
            优先使用显式传参, 其次读取环境变量, 最后回退到 backend/runtime/exam_share.
        参数:
            storage_root: 外部传入的存储根目录.
        返回值:
            Path: 规范化后的根目录路径.
        异常:
            无.
        """
        if storage_root is not None:
            return Path(storage_root).expanduser().resolve()
        env_value = str(os.getenv("EXAM_SHARE_STORAGE_DIR", "")).strip()
        if env_value:
            return Path(env_value).expanduser().resolve()
        backend_root = Path(__file__).resolve().parents[3]
        return (backend_root / "runtime" / "exam_share").resolve()

    def _papers_directory(self) -> Path:
        """
        获取考试文件目录.

        用途:
            返回已发布考试 JSON 文件存放目录.
        参数:
            无.
        返回值:
            Path: 考试文件目录.
        异常:
            无.
        """
        return self._storage_root / "papers"

    def _submissions_directory(self) -> Path:
        """
        获取答卷文件目录.

        用途:
            返回考生答卷 JSON 文件存放目录.
        参数:
            无.
        返回值:
            Path: 答卷目录.
        异常:
            无.
        """
        return self._storage_root / "submissions"

    def _index_file(self) -> Path:
        """
        获取分享索引文件路径.

        用途:
            返回 share_token 到 exam_id 的索引文件路径.
        参数:
            无.
        返回值:
            Path: 索引文件路径.
        异常:
            无.
        """
        return self._storage_root / "share_index.json"

    def _paper_file(self, exam_id: str) -> Path:
        """
        获取单个考试文件路径.

        用途:
            根据考试 ID 生成考试 JSON 文件路径.
        参数:
            exam_id: 考试 ID.
        返回值:
            Path: 考试文件路径.
        异常:
            无.
        """
        return self._papers_directory() / f"{exam_id}.json"

    def _submission_file(self, submission_id: str) -> Path:
        """
        获取单个答卷文件路径.

        用途:
            根据答卷 ID 生成答卷 JSON 文件路径.
        参数:
            submission_id: 答卷 ID.
        返回值:
            Path: 答卷文件路径.
        异常:
            无.
        """
        return self._submissions_directory() / f"{submission_id}.json"

    def _ensure_directory(self, directory: Path) -> None:
        """
        确保存储目录存在.

        用途:
            在目录不存在时自动创建, 避免后续文件读写失败.
        参数:
            directory: 待确保存在的目录路径.
        返回值:
            None.
        异常:
            FileOperationError: 当目录创建失败时抛出.
        """
        try:
            directory.mkdir(parents=True, exist_ok=True)
        except OSError as error:
            raise FileOperationError(message=f"创建考试分享目录失败: {directory}") from error

    def _read_json(self, file_path: Path, default: Any) -> Any:
        """
        读取 JSON 文件.

        用途:
            在文件不存在时返回默认值, 在文件存在时解析 JSON 内容.
        参数:
            file_path: JSON 文件路径.
            default: 文件不存在时返回的默认值.
        返回值:
            Any: JSON 解析结果或默认值.
        异常:
            FileOperationError: 当 JSON 解析失败时抛出.
        """
        if not file_path.exists():
            return default
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise FileOperationError(message=f"读取考试分享文件失败: {file_path.name}") from error

    def _write_json(self, file_path: Path, payload: Any) -> None:
        """
        原子写入 JSON 文件.

        用途:
            先写入临时文件再替换目标文件, 减少异常中断导致的文件损坏风险.
        参数:
            file_path: 目标 JSON 文件路径.
            payload: 待写入的数据对象.
        返回值:
            None.
        异常:
            FileOperationError: 当 JSON 写入失败时抛出.
        """
        try:
            with NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                delete=False,
                dir=file_path.parent,
                suffix=".tmp",
            ) as temporary_file:
                json.dump(payload, temporary_file, ensure_ascii=False, indent=2)
                temporary_name = temporary_file.name
            Path(temporary_name).replace(file_path)
        except (OSError, TypeError, ValueError) as error:
            raise FileOperationError(message=f"写入考试分享文件失败: {file_path.name}") from error


__all__ = ["ExamShareFileRepository"]
