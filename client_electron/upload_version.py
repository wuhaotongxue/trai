#!/usr/bin/env python
"""手动上传指定版本"""
import os
import sys
import re
from pathlib import Path

# 加载环境变量
_env_file = Path(__file__).parent.parent / "backend" / ".env"
if _env_file.exists():
    with open(_env_file, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

import boto3
import yaml
import datetime
import hashlib

def calc_sha512(path):
    h = hashlib.sha512()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

endpoint = os.getenv("S3_ENDPOINT")
access_key = os.getenv("S3_ACCESS_KEY")
secret_key = os.getenv("S3_SECRET_KEY")
bucket = os.getenv("S3_BUCKET")
def extract_version_from_filename(filename):
    """从文件名提取版本号，如 'TRAI Setup 0.0.1.202604251200.exe' -> '0.0.1.202604251200'"""
    match = re.search(r'(\d+\.\d+\.\d+\.\d{10,14})', filename)
    if match:
        return match.group(1)
    return None

version = os.getenv("VERSION", "")
exe_file = None

if version:
    exe_file = Path(__file__).parent / "release" / f"TRAI Setup {version}.exe"

# 如果没指定版本或文件不存在，自动查找最新的 exe
if not exe_file or not exe_file.exists():
    release_dir = Path(__file__).parent / "release"
    exe_files = sorted(release_dir.glob("TRAI Setup *.exe"), key=lambda f: f.stat().st_mtime, reverse=True)
    if exe_files:
        exe_file = exe_files[0]
        version = extract_version_from_filename(exe_file.name)
        if not version:
            version = os.getenv("VERSION", "0.0.1")

print(f"Version: {version}")
print(f"Installer: {exe_file}")
print(f"Exists: {exe_file.exists()}")

if not exe_file.exists():
    print("ERROR: Installer not found!")
    sys.exit(1)

s3 = boto3.client(
    's3',
    endpoint_url=endpoint,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name='us-east-1',
    config=boto3.session.Config(signature_version='s3v4')
)

# 上传安装包
exe_key = f"releases/{version}/{exe_file.name}"
print(f"Uploading to: {exe_key}")
s3.upload_file(
    str(exe_file), bucket, exe_key,
    ExtraArgs={'ContentType': 'application/x-msdownload', 'ACL': 'public-read'}
)
print("OK!")

# 生成 latest.yml
sha512 = calc_sha512(exe_file)
print(f"File SHA512: {sha512}")

yml_data = {
    'version': version,
    'releaseDate': datetime.datetime.now().isoformat(),
    'files': [{'url': exe_file.name, 'sha512': sha512, 'size': exe_file.stat().st_size}],
    'path': exe_file.name
}
yml_content = yaml.dump(yml_data)
s3.put_object(Bucket=bucket, Key=f'releases/{version}/latest.yml', Body=yml_content.encode('utf-8'), ContentType='application/x-yaml', ACL='public-read')
s3.put_object(Bucket=bucket, Key='releases/latest.yml', Body=yml_content.encode('utf-8'), ContentType='application/x-yaml', ACL='public-read')
print("latest.yml updated!")
