# TRAI_项目临时文件管理规范

## 概述

本规范用于管理项目中的临时/测试文件，包括 `fix_` 前缀的修复文件和 `check_` 前缀的检查脚本。所有临时文件必须遵循本规范，避免污染项目代码库。

---

## 1. 目录结构

### 前端 (frontend_next)

```
frontend_next/
├── fix_files/                    # 前端修复临时文件
│   └── [fix_*.tsx, fix_*.ts]
└── check_files/                  # 前端检查临时文件 (前端一般不用)
```

### 后端 (backend)

```
backend/
├── fix_files/                    # 后端修复临时文件
│   └── [fix_*.py]
└── check_files/                  # 后端检查脚本
    └── [check_*.py]
```

### Electron 客户端 (client_electron)

```
client_electron/
├── fix_files/                    # Electron 修复临时文件
│   └── [fix_*.tsx, fix_*.ts]
└── check_files/                  # Electron 检查脚本
    └── [check_*.ts]
```

### PyQt6 桌面客户端 (client_pyqt6)

```
client_pyqt6/
├── fix_files/                    # PyQt6 修复临时文件
│   └── [fix_*.py]
└── check_files/                  # PyQt6 检查脚本
    └── [check_*.py]
```

---

## 2. Gitignore 配置

### 已在 .gitignore 中配置的忽略规则

```gitignore
# fix_files 临时修复文件
*/fix_files/
fix_files/

# check_files 检查脚本
*/check_files/
check_files/

# 独立临时文件
fix_*.py
fix_*.ts
fix_*.tsx
check_*.py
check_*.ts
check_*.tsx
```

---

## 3. 文件命名规范

| 类型 | 前缀 | 示例 | 用途 |
|------|------|------|------|
| 修复文件 | `fix_` | `fix_login_bug.py` | 临时修复问题 |
| 检查脚本 | `check_` | `check_db_conn.py` | 数据检查/验证 |

---

## 4. 使用流程

### 4.1 创建临时文件

```bash
# 后端 - 在正确目录创建
touch backend/fix_files/fix_session_timeout.py
touch backend/check_files/check_user_table.py

# 前端
touch frontend_next/fix_files/fix_render_issue.tsx

# Electron
touch client_electron/fix_files/fix_login_page.tsx
```

### 4.2 使用后清理

1. **完成修复后**: 将代码合并到正式文件，然后删除 `fix_` 文件
2. **检查完成后**: 导出结果后立即删除 `check_` 文件
3. **定期清理**: 每次提交前检查并清空这些文件夹

### 4.3 清理命令

```bash
# 清理所有临时文件 (谨慎使用!)
rm -rf frontend_next/fix_files/* backend/fix_files/* client_electron/fix_files/*
rm -rf backend/check_files/* client_electron/check_files/*

# 清理独立临时文件
rm -f fix_*.py fix_*.ts fix_*.tsx
rm -f check_*.py check_*.ts
```

---

## 5. 规则约束

### 5.1 必须遵守

- 所有 `fix_` 和 `check_` 文件必须放在对应的 `_files/` 目录下
- 独立命名的临时文件必须以 `fix_` 或 `check_` 开头
- 使用完毕后 **必须** 立即删除
- 禁止将临时文件提交到 Git

### 5.2 禁止事项

- ❌ 禁止在项目根目录创建临时文件
- ❌ 禁止在 `src/`、`app/`、`pages/` 等正式代码目录创建临时文件
- ❌ 禁止提交包含调试代码的临时文件
- ❌ 禁止在临时文件中留下敏感信息

---

## 6. 自动清理脚本

### 后端清理脚本

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: cleanup_temp_files.py
# 作者: wuhao
# 日期: 2026_04_24
# 描述: 清理项目临时文件

import os
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent

def cleanup():
    patterns = [
        PROJECT_ROOT / "backend" / "fix_files",
        PROJECT_ROOT / "backend" / "check_files",
        PROJECT_ROOT / "frontend_next" / "fix_files",
        PROJECT_ROOT / "client_electron" / "fix_files",
        PROJECT_ROOT / "client_pyqt6" / "fix_files",
    ]

    for pattern in patterns:
        if pattern.exists():
            shutil.rmtree(pattern)
            pattern.mkdir(parents=True, exist_ok=True)
            print(f"Cleaned: {pattern}")

if __name__ == "__main__":
    cleanup()
```

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-04-24 | 初版发布 |
