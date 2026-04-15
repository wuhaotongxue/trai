# Backend_Python_代码规范

---

## 1. 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. Python 3.13 环境

| 设置项 | 值 |
|--------|------|
| 标准环境 | `trai_31313_20260413` (Conda) |
| 虚拟环境强制 | **绝对禁止**使用非虚拟环境 (System Python)。必须在 `trai_31313_20260413` 环境下操作 |
| 类型提示 | `|` 替代 `Union`/`Optional`，`list[int]` 替代 `typing.List` |
| 缩进 | 4 个空格，禁止 Tab |

---

## 3. 路径规范

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 禁止硬编码 `\`</strong>，必须使用 `pathlib`
</div>

---

## 4. Import 规范

| 顺序 | 类型 | 示例 |
|------|------|------|
| 1 | 第三方库 | `import boto3` |
| 2 | 标准库 | `import uuid` |
| 3 | 本项目 | `from backend.src.domain.user.entities import User` |

**约束**：
- 禁止保留未使用的 `import`
- 同一类库按字母顺序排列
- 每组之间空一行

---

## 5. 日志规范

**约束**：
- 禁止使用 `print()`，必须使用 `loguru` 或项目封装的 `logger`
- 日志必须包含结构化信息

---

## 6. 异常规范

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li><strong>禁止裸 <code>except:</code></strong>，必须指明异常类型</li>
    <li><strong>禁止静默 <code>pass</code></strong>，捕获后必须 <code>logger.error(...)</code> 记录</li>
  </ul>
</div>

---

## 7. Docstring 规范

**约束**：
- 每一个 `class` 及 `def`/`async def` 必须有中文 docstring
- 包括私有方法、`__init__`、`@staticmethod`、`@classmethod`
- 内容必须包含：**用途或流程概述** + **参数** + **返回值** + **异常** 四段

---

## 8. 文件头模板

```python
#!/usr/bin/env python
# _*_coding:_utf_8_*_
# 文件名:_{实际文件名}
# 作者:_wuhao
# 日期:_{YYYY_MM_DD_HH:MM:SS}
# 描述:_{该文件的用途/功能简述，一句话概括}
```

---

## 9. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止裸 except</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须指明异常类型</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 print</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须使用 logger</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">pathlib</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止硬编码路径</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">文件头</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">作者: wuhao</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">Docstring</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">每个 def 必须有</div>
  </div>

</div>
