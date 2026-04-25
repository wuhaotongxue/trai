#!/usr/bin/env python
"""Verify S3 upload"""
import boto3
import os
from pathlib import Path

_env_file = Path('backend/.env')
if _env_file.exists():
    with open(_env_file, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

s3 = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_ENDPOINT', 'http://192.168.0.190:12001'),
    aws_access_key_id=os.getenv('S3_ACCESS_KEY', ''),
    aws_secret_access_key=os.getenv('S3_SECRET_KEY', ''),
    region_name='us-east-1',
    config=boto3.session.Config(signature_version='s3v4')
)

print('S3 releases/ content:')
resp = s3.list_objects_v2(Bucket='trai', Prefix='releases/')
for obj in resp.get('Contents', []):
    size_mb = obj['Size'] / 1024 / 1024
    print(f'  {obj["Key"]} - {size_mb:.2f} MB')

# 获取 latest.yml 内容
print('\nlatest.yml content:')
try:
    resp = s3.get_object(Bucket='trai', Key='releases/latest.yml')
    print(resp['Body'].read().decode('utf-8'))
except Exception as e:
    print(f'Error: {e}')
