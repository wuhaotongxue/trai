---
name: "encoding-fix"
description: "修复文件编码问题和 Python 脚本创建规范。"
---

# 文件编码修复工具与 Python 脚本规范

## 何时使用

当代码文件出现中文乱码时，或需要使用 Python 创建文件时。

---

## 第一部分：文件编码修复

### 常见乱码场景

使用 Write 工具写入带中文的代码文件后，文件出现乱码。

### 修复方法

**Step 1**: 创建 Python 脚本

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

content = """文件内容，包含中文注释"""

with open(r'<目标文件路径>', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
```

**Step 2**: 运行脚本

```bash
python <脚本路径>
```

**Step 3**: 验证文件

用 Read 工具检查文件内容是否正确。

**Step 4**: 删除临时脚本

用完后删除临时脚本，保持工作目录整洁。

### 工具位置

```
.cursor/skills/project/fix_encoding/
├── SKILL.md          # 本文件
├── check_utf8.py     # 检查文件编码
└── write_utf8.py     # 写入 UTF-8 文件
```

---

## 第二部分：Python 脚本创建规范（CRITICAL）

### 禁止使用的写法

1. **禁止三引号嵌套**
   ```python
   # 错误！三引号里面有三引号会冲突
   content = '''内容包含'''会冲突'''
   ```

2. **禁止转义字符问题**
   ```python
   # 错误！\n \t 等转义可能出问题
   content = "路径\\n名字"  # Windows 路径
   ```

### 正确的写法

**方案 1：单行列表 + join（推荐）**

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

lines = [
    '第一行内容',
    '第二行内容: ' + chr(244) + chr(59),  # 如需特殊字符用 chr()
    '第三行内容',
]

with open(r'e:\\path\\to\\file.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
```

**方案 2：os.linesep（跨平台换行）**

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os

content = '第一行' + os.linesep + '第二行'

with open(r'e:\\path\\to\\file.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
```

**方案 3：Write 工具写入 + Python 验证**

直接用 Write 工具写入文件，然后用 Python 脚本验证编码：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 验证文件编码
with open(r'<文件路径>', 'r', encoding='utf-8') as f:
    content = f.read()
    print('UTF-8 OK, length:', len(content))
```

### Windows 路径处理

```python
# 正确：使用原始字符串 r''
with open(r'e:\path\to\file.txt', 'w', encoding='utf-8') as f:
    f.write(content)

# 错误：普通字符串需要双反斜杠
with open('e:\\path\\to\\file.txt', 'w', encoding='utf-8') as f:
    f.write(content)
```

### 中文内容处理

```python
# 直接写中文字符串（Python 3 默认 UTF-8）
content = '这是中文内容'

# 如果需要特殊字符，用 chr()
# chr(20320) = '你', chr(22909) = '好'
```

---

## 第三部分：Vite/缓存问题

### 白屏问题排查

如果修改代码后出现白屏，检查：

1. **编译错误**：查看终端是否有 `Internal server error`
2. **Vite 缓存**：运行 `pnpm dev` 时可能需要清除缓存

```bash
# 清除 node_modules/.vite 缓存
Remove-Item -Recurse -Force node_modules/.vite

# 重启开发服务器
pnpm dev
```

### 常见编译错误

1. **重复 import**
   ```
   Identifier 'xxx' has already been declared
   ```
   检查是否有重复的 import 语句。

2. **模块找不到**
   ```
   Cannot find module '@/xxx'
   ```
   检查 vite.config.ts 中的路径别名配置。

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.1 | 2026-04-24 | 新增 Python 脚本创建规范，禁止三引号嵌套 |
| v1.0 | 2026-04-24 | 初版 |
