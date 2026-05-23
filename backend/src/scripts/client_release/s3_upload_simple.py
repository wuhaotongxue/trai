#!/usr/bin/env python
# 文件名: s3_upload_simple.py
# 作者: wuhao
# 日期: 2026_05_23_17:28:12
# 描述: 自动补充的文件头说明.

"""
文件名: s3_upload_simple.py
作者: wuhao
日期: 2026_04_25_04:35:00
描述: 简单的 S3 上传脚本 - 不需要后端 API

用法:
    python s3_upload_simple.py              # 交互模式
    python s3_upload_simple.py --version 0.1.0  # 指定版本, 自动上传
"""

import argparse
import os
import sys
from pathlib import Path

from loguru import logger

# 确保 backend 路径
_backend_path = Path(__file__).parent.parent / "backend"
if _backend_path.exists():
    sys.path.insert(0, str(_backend_path.resolve()))

try:
    from run import EnvFileLoader

    EnvFileLoader.load_local_envs()
except ImportError:
    pass

import boto3
import yaml
from botocore.exceptions import ClientError

# 加载 .env
_env_file = Path(__file__).parent.parent / "backend" / ".env"
if _env_file.exists():
    with open(_env_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def main():
    parser = argparse.ArgumentParser(description="TRAI S3 Upload Tool")
    parser.add_argument("--version", "-v", type=str, help="Version number")
    parser.add_argument("--auto", "-y", action="store_true", help="Auto confirm")
    parser.add_argument("--bucket", "-b", type=str, help="S3 Bucket")
    parser.add_argument("--endpoint", "-e", type=str, help="S3 Endpoint")
    args = parser.parse_args()

    endpoint = args.endpoint or os.getenv("S3_ENDPOINT", "http://192.168.0.190:12001")
    access_key = os.getenv("S3_ACCESS_KEY", "")
    secret_key = os.getenv("S3_SECRET_KEY", "")
    bucket = args.bucket or os.getenv("S3_BUCKET", "trai")
    public_domain = os.getenv("S3_PUBLIC_DOMAIN", "")
    version = args.version or os.getenv("VERSION", "0.1.0")
    release_dir = Path(__file__).parent / "release"

    logger.info(f"\n{'=' * 50}")
    logger.info("TRAI Client S3 Upload Tool")
    logger.info(f"{'=' * 50}\n")

    exe_files = list(release_dir.glob("*.exe"))
    exe_files = [f for f in exe_files if "Setup" in f.name]

    if not exe_files:
        logger.error(f"No installer found: {release_dir}")
        return

    exe_file = exe_files[0]
    logger.info(f"Installer: {exe_file}")
    logger.info(f"Version: {version}")
    logger.info(f"Size: {exe_file.stat().st_size / 1024 / 1024:.2f} MB")
    logger.info(f"Bucket: {bucket}")
    logger.info(f"Endpoint: {endpoint}\n")

    if not args.auto:
        confirm = input("Confirm upload? (y/n): ").strip().lower()
        if confirm != "y":
            logger.info("Cancelled")
            return
    else:
        logger.info("Auto mode, skipping confirm")

    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="us-east-1",
    )

    exe_key = f"releases/{version}/{exe_file.name}"
    logger.info(f"\nUploading installer to: {exe_key}")

    try:
        s3.upload_file(
            str(exe_file), bucket, exe_key, ExtraArgs={"ContentType": "application/x-msdownload", "ACL": "public-read"}
        )
        logger.success("Installer uploaded!")
    except ClientError as e:
        logger.error(f"Upload failed: {e}")
        return

    import datetime

    yml_data = {
        "version": version,
        "releaseDate": datetime.datetime.now().isoformat(),
        "files": [{"url": exe_file.name, "sha512": "placeholder", "size": exe_file.stat().st_size}],
        "path": exe_file.name,
    }

    yml_content = yaml.dump(yml_data)
    yml_key = f"releases/{version}/latest.yml"

    logger.info(f"\nUploading latest.yml to: {yml_key}")

    try:
        s3.put_object(
            Bucket=bucket,
            Key=yml_key,
            Body=yml_content.encode("utf-8"),
            ContentType="application/x-yaml",
            ACL="public-read",
        )
        logger.success("latest.yml uploaded!")
    except ClientError as e:
        logger.error(f"latest.yml upload failed: {e}")
        return

    logger.info("\nUpdating latest channel...")
    try:
        s3.put_object(
            Bucket=bucket,
            Key="releases/latest.yml",
            Body=yml_content.encode("utf-8"),
            ContentType="application/x-yaml",
            ACL="public-read",
        )
        s3.copy_object(Bucket=bucket, Key="releases/TRAI-latest.exe", CopySource={"Bucket": bucket, "Key": exe_key})
        logger.success("Latest channel updated!")
    except ClientError as e:
        logger.warning(f"Latest channel update failed: {e}")

    logger.info(f"\n{'=' * 50}")
    logger.success("Upload completed!")
    logger.info(f"{'=' * 50}\n")

    if public_domain:
        url = f"{public_domain}/releases/{version}/{exe_file.name}"
    else:
        url = f"{endpoint}/{bucket}/releases/{version}/{exe_file.name}"

    logger.info(f"Download URL: {url}")
    logger.info("\nClients can check for updates in Settings page")


if __name__ == "__main__":
    main()
