#!/usr/bin/env python
# 文件名: s3_storage.py
# 作者: wuhao
# 日期: 2026_05_26_20:45:12
# 描述: S3 存储基础设施实现, 支持本地 MinIO 与标准 S3 协议, 具备大文件分片上传与 Presigned URL 签发能力

from __future__ import annotations

import os
from typing import Any

import boto3
from botocore.exceptions import ClientError
from loguru import logger

from core.exceptions import ExternalServiceError


class S3StorageService:
    """
    S3 存储服务类, 封装了文件的上传、下载、删除及 Presigned URL 生成逻辑
    """

    def __init__(self) -> None:
        """
        初始化 S3 客户端配置

        参数:
            None
        返回值:
            None
        """
        self._endpoint: str = os.getenv("S3_ENDPOINT", "http://localhost:9000")
        self._presign_public_base: str = os.getenv("S3_PRESIGNED_PUBLIC_BASE", "").strip()
        self._access_key: str = os.getenv("S3_ACCESS_KEY", "")
        self._secret_key: str = os.getenv("S3_SECRET_KEY", "")
        self._bucket: str = os.getenv("S3_BUCKET", "trai")
        self._region: str = os.getenv("S3_REGION", "us-east-1")
        self._secure: bool = os.getenv("S3_SECURE", "false").lower() == "true"
        self._public_domain: str = os.getenv("S3_PUBLIC_DOMAIN", "")
        self._client = self._create_client(endpoint=self._endpoint)

    def _create_client(self, endpoint: str) -> Any:
        """
        创建并配置 Boto3 S3 客户端

        参数:
            endpoint (str): S3 服务端点地址
        返回值:
            Any: 配置好的 Boto3 客户端实例
        """
        from botocore.config import Config

        # 配置更高的超时和重试以处理大文件
        config = Config(
            connect_timeout=10,
            read_timeout=300,  # 5分钟读取超时
            retries={"max_attempts": 3},
        )
        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=self._access_key,
            aws_secret_access_key=self._secret_key,
            region_name=self._region,
            use_ssl=self._secure,
            config=config,
        )

    def upload_file(
        self,
        file_path: str,
        object_key: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        上传本地文件到 S3 指定位置, 自动处理大文件分片

        参数:
            file_path (str): 本地文件路径
            object_key (str): S3 存储路径(键名)
            content_type (str): HTTP Content-Type
        返回值:
            str: 成功后的文件访问 URL
        异常:
            ExternalServiceError: S3 通信或权限异常时抛出
        """
        logger.info(f"S3 上传 | 文件: {file_path} | 键: {object_key}")

        try:
            from boto3.s3.transfer import TransferConfig

            # 对大文件(如视频)使用分片上传, 提升稳定性和速度
            config = TransferConfig(
                multipart_threshold=1024 * 1024 * 5,
                max_concurrency=5,
                multipart_chunksize=1024 * 1024 * 5,
                use_threads=True,
            )
            self._client.upload_file(
                file_path, self._bucket, object_key, ExtraArgs={"ContentType": content_type}, Config=config
            )
            return self.get_file_url(object_key)

        except ClientError as e:
            logger.error(f"S3 上传失败 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"S3 上传失败: {str(e)}",
                details={"error": str(e)},
            )

    def get_file_url(self, object_key: str) -> str:
        """
        获取文件的直接访问 URL

        参数:
            object_key (str): S3 存储路径
        返回值:
            str: 拼接好的文件地址
        """
        if self._public_domain:
            return f"{self._public_domain.rstrip('/')}/{object_key.lstrip('/')}"
        return f"{self._endpoint.rstrip('/')}/{self._bucket}/{object_key.lstrip('/')}"

    def upload_bytes(self, data: bytes, object_key: str, content_type: str = "application/octet-stream") -> str:
        """
        上传字节数据到 S3 指定位置

        参数:
            data (bytes): 文件字节数据
            object_key (str): S3 存储路径(键名)
            content_type (str): HTTP Content-Type
        返回值:
            str: 成功后的文件访问 URL
        异常:
            ExternalServiceError: S3 通信或权限异常时抛出
        """
        logger.info(f"S3 上传 bytes | 键: {object_key} | 大小: {len(data)} bytes")
        try:
            self._client.put_object(Bucket=self._bucket, Key=object_key, Body=data, ContentType=content_type)
            return self.get_file_url(object_key)
        except ClientError as e:
            logger.error(f"S3 上传 bytes 失败 | 错误: {str(e)}")
            raise ExternalServiceError(
                message=f"S3 上传 bytes 失败: {str(e)}",
                details={"error": str(e)},
            )

    def get_long_term_url(self, object_key: str, expires_days: int = 7) -> str:
        """
        获取文件的长期访问预签名 URL

        参数:
            object_key (str): S3 对象键
            expires_days (int): 有效期(天)
        返回值:
            str: 预签名 URL
        """
        try:
            # 统一使用内网 endpoint 生成预签名 URL (保持 s3v4 签名一致性)
            url = self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": object_key},
                ExpiresIn=expires_days * 24 * 3600,
            )

            # 如果配置了外网网关域名，将内网 endpoint 替换为外网域名
            # 因为 Nginx 会剥离一层 /trai/，所以这里替换后会形成双 bucket 路径 (例如 /trai/trai/...)
            # 这样经过 Nginx 转发给 MinIO 时，路径和 Host 头都与签名时完全一致
            if self._presign_public_base:
                public_base = self._presign_public_base.rstrip("/")
                endpoint = self._endpoint.rstrip("/")
                url = url.replace(endpoint, public_base)

            return url
        except ClientError as e:
            logger.error(f"S3 生成长期 URL 失败 | error={str(e)}")
            raise ExternalServiceError(f"生成文件长期 URL 失败: {str(e)}")
            return self.get_file_url(object_key)

    def get_presigned_url(self, object_key: str, expires_in: int = 3600) -> str:
        """
        获取文件的临时访问预签名 URL

        参数:
            object_key (str): S3 对象键
            expires_in (int): 有效期(秒)
        返回值:
            str: 预签名 URL
        """
        try:
            # 统一使用内网 endpoint 生成预签名 URL (保持 s3v4 签名一致性)
            url = self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": object_key},
                ExpiresIn=expires_in,
            )

            # 如果配置了外网网关域名，将内网 endpoint 替换为外网域名
            # 因为 Nginx 会剥离一层 /trai/，所以这里替换后会形成双 bucket 路径 (例如 /trai/trai/...)
            # 这样经过 Nginx 转发给 MinIO 时，路径和 Host 头都与签名时完全一致
            if self._presign_public_base:
                public_base = self._presign_public_base.rstrip("/")
                endpoint = self._endpoint.rstrip("/")
                url = url.replace(endpoint, public_base)

            return url
        except ClientError as e:
            logger.error(f"S3 生成临时 URL 失败 | error={str(e)}")
            raise ExternalServiceError(f"生成文件临时 URL 失败: {str(e)}")
            return self.get_file_url(object_key)

    def delete_file(self, object_key: str) -> bool:
        """
        删除 S3 文件

        参数:
            object_key (str): S3 存储路径
        返回值:
            bool: 是否成功
        """
        try:
            self._client.delete_object(Bucket=self._bucket, Key=object_key)
            return True
        except ClientError as e:
            logger.error(f"S3 删除文件失败 | 错误: {str(e)}")
            return False

    def list_objects(self, prefix: str = "") -> list[dict]:
        """
        列出指定前缀的 S3 对象

        参数:
            prefix (str): 前缀
        返回值:
            list[dict]: 对象列表, 包含 Key, LastModified, Size 等信息
        """
        objects = []
        try:
            paginator = self._client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=self._bucket, Prefix=prefix):
                if "Contents" in page:
                    objects.extend(page["Contents"])
        except ClientError as e:
            logger.error(f"S3 列出文件失败 | 前缀: {prefix} | 错误: {str(e)}")
        return objects

    def delete_objects(self, object_keys: list[str]) -> bool:
        """
        批量删除 S3 文件

        参数:
            object_keys (list[str]): S3 存储路径列表
        返回值:
            bool: 是否成功
        """
        if not object_keys:
            return True

        try:
            # S3 批量删除单次最多 1000 个
            for i in range(0, len(object_keys), 1000):
                batch = object_keys[i : i + 1000]
                delete_dict = {"Objects": [{"Key": key} for key in batch], "Quiet": True}
                self._client.delete_objects(Bucket=self._bucket, Delete=delete_dict)
            return True
        except ClientError as e:
            logger.error(f"S3 批量删除文件失败 | 错误: {str(e)}")
            return False


def get_s3_storage() -> S3StorageService:
    """
    单例获取 S3 存储服务实例

    参数:
        None
    返回值:
        S3StorageService: 服务实例
    """
    return S3StorageService()
