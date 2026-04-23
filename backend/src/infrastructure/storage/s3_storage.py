#!/usr/bin/env python
# 文件名: storage.py
# 作者: wuhao
# 日期: 2026_04_09
# 描述: S3 存储服务

from __future__ import annotations

import os
from typing import Any

import boto3
from botocore.exceptions import ClientError
from loguru import logger

from core.exceptions import ExternalServiceError


class S3StorageService:
    """S3 存储服务(支持 MinIO)"""

    def __init__(self) -> None:
        self._endpoint: str = os.getenv("S3_ENDPOINT", "http://localhost:9000")
        self._access_key: str = os.getenv("S3_ACCESS_KEY", "")
        self._secret_key: str = os.getenv("S3_SECRET_KEY", "")
        self._bucket: str = os.getenv("S3_BUCKET", "trai")
        self._region: str = os.getenv("S3_REGION", "us-east-1")
        self._secure: bool = os.getenv("S3_SECURE", "false").lower() == "true"
        self._public_domain: str = os.getenv("S3_PUBLIC_DOMAIN", "")
        self._client = self._create_client()

    def _create_client(self) -> Any:
        """创建 S3 客户端"""
        return boto3.client(
            "s3",
            endpoint_url=self._endpoint,
            aws_access_key_id=self._access_key,
            aws_secret_access_key=self._secret_key,
            region_name=self._region,
            use_ssl=self._secure,
        )

    def upload_file(
        self,
        file_path: str,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """上传文件

        Args:
            file_path: 本地文件路径
            object_key: S3 对象键
            content_type: 内容类型

        Returns:
            str: 文件 URL
        """
        logger.info(f"S3 上传 | 文件: {file_path} | 键: {object_key}")

        try:
            self._client.upload_file(
                file_path,
                self._bucket,
                object_key,
                ExtraArgs={"ContentType": content_type},
            )
            return self.get_file_url(object_key)

        except ClientError as e:
            logger.error(f"S3 上传失败 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"S3 上传失败: {str(e)}",
                details={"error": str(e)},
            )

    def upload_bytes(
        self,
        data: bytes,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """上传字节数据

        Args:
            data: 字节数据
            object_key: S3 对象键
            content_type: 内容类型

        Returns:
            str: 文件 URL
        """
        logger.info(f"S3 上传字节 | 键: {object_key} | 大小: {len(data)} bytes")

        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=object_key,
                Body=data,
                ContentType=content_type,
            )
            return self.get_file_url(object_key)

        except ClientError as e:
            logger.error(f"S3 上传失败 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"S3 上传失败: {str(e)}",
                details={"error": str(e)},
            )

    def get_presigned_url(self, object_key: str, expires_in: int = 300) -> str:
        """获取预签名 URL

        Args:
            object_key: S3 对象键
            expires_in: 过期时间(秒)

        Returns:
            str: 预签名 URL
        """
        try:
            url = self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": object_key},
                ExpiresIn=expires_in,
            )
            return url

        except ClientError as e:
            logger.error(f"S3 预签名 URL 生成失败 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"S3 预签名 URL 生成失败: {str(e)}",
                details={"error": str(e)},
            )

    def delete_file(self, object_key: str) -> bool:
        """删除文件

        Args:
            object_key: S3 对象键

        Returns:
            bool: 是否成功
        """
        try:
            self._client.delete_object(Bucket=self._bucket, Key=object_key)
            return True

        except ClientError as e:
            logger.error(f"S3 删除失败 | 错误: {str(e)}")
            return False

    def get_file_url(self, object_key: str) -> str:
        """获取文件 URL (优先使用公共域名)"""
        if self._public_domain:
            return f"{self._public_domain}/{object_key}"
        return f"{self._endpoint}/{self._bucket}/{object_key}"

    def list_objects(self, prefix: str = "") -> list[dict[str, Any]]:
        """获取对象列表

        Args:
            prefix: 前缀过滤

        Returns:
            list[dict]: 对象信息列表
        """
        try:
            response = self._client.list_objects_v2(Bucket=self._bucket, Prefix=prefix)
            if "Contents" not in response:
                return []
            
            return [
                {
                    "key": item["Key"],
                    "size": item["Size"],
                    "last_modified": item["LastModified"].isoformat(),
                    "url": self.get_presigned_url(item["Key"], 3600)
                }
                for item in response["Contents"]
            ]
        except ClientError as e:
            logger.error(f"S3 列表获取失败 | 错误: {str(e)}")
            return []


__all__ = ["S3StorageService"]
