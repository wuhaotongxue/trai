import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database.database import Base


class AudioTranscribeRecordModel(Base):
    __tablename__ = "audio_transcribe_records"
    __table_args__ = {"comment": "音频转写历史记录表"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, comment="主键 ID")
    creator_id: Mapped[str] = mapped_column(String(255), nullable=True, comment="创建者 ID")

    file_name: Mapped[str] = mapped_column(String(255), nullable=False, comment="原始文件名")
    source_audio_url: Mapped[str] = mapped_column(String(1024), nullable=False, comment="S3 源音频 URL")

    status: Mapped[str] = mapped_column(
        String(50), default="processing", nullable=False, comment="状态 (processing, success, failed)"
    )

    md_url: Mapped[str] = mapped_column(String(1024), nullable=True, comment="Markdown 下载链接")
    txt_url: Mapped[str] = mapped_column(String(1024), nullable=True, comment="TXT 下载链接")
    pdf_url: Mapped[str] = mapped_column(String(1024), nullable=True, comment="PDF 下载链接")

    result_text: Mapped[str] = mapped_column(String, nullable=True, comment="识别结果文本 (长文本)")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(0), server_default=func.current_timestamp(0), nullable=False, comment="创建时间"
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(0),
        server_default=func.current_timestamp(0),
        onupdate=func.current_timestamp(0),
        nullable=False,
        comment="更新时间",
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="软删除标记")
