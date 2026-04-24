#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
UTF-8 文件写入脚本
用法: python write_utf8.py <目标文件路径>
输入内容后按 Ctrl+D (Linux/Mac) 或 Ctrl+Z 回车 (Windows) 结束
"""

import sys

def write_utf8_file(filepath):
    """从 stdin 读取内容并写入 UTF-8 文件"""
    print(f'请输入文件内容，输入完成后按 Ctrl+D 结束:')
    content = sys.stdin.read()
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'已写入: {filepath}')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('用法: python write_utf8.py <目标文件路径>')
        sys.exit(1)
    write_utf8_file(sys.argv[1])
