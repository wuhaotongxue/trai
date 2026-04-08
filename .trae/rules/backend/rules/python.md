# Backend - Python 代码规范

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
| 标准环境 | `zz_trai_3_13_12_dev_20260311` (Conda) |
| 类型提示 | `\|` 替代 `Union`/`Optional`，`list[int]` 替代 `typing.List` |
| 缩进 | 4 个空格，禁止 Tab |

---

## 3. 路径规范

```python
# ❌ 禁止硬编码
path = "C:\\Users\\test\\file.txt"

# ✅ 正确: pathlib
from pathlib import Path
path = Path(__file__).parent / "file.txt"
```

---

## 4. Import 规范

| 顺序 | 示例 |
|------|------|
| 1. 第三方库 | `from fastapi import APIRouter` |
| 2. 标准库 | `import uuid`, `from datetime import datetime` |
| 3. 本项目 | `from backend.src.domain.user.entities import User` |

- 禁止保留未使用的 `import`
- 同一类库按字母顺序排列

---

## 5. 日志规范

```python
# ❌ 禁止 print
print(f"User login: {username}")

# ✅ 正确: logger
logger.info(f"User login: username={username}")
logger.error(f"Login failed: {e}", exc_info=True)
```

---

## 6. 异常规范

```python
# ❌ 禁止裸 except
except:
    pass

# ❌ 禁止静默 pass
except Exception:
    pass

# ✅ 正确: 指明异常 + 记录
except ValueError as e:
    logger.warning(f"Invalid value: {e}")
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise
```

---

## 7. Docstring 格式

```python
class MeetingService:
    """
    会议服务类，封装会议业务的流程编排.

    参数:
        meeting_repo: 会议仓储接口实例.

    异常:
        ValueError: 会议不存在时抛出.
    """

    async def create_meeting(self, title: str, host_id: uuid.UUID) -> Meeting:
        """
        创建新会议.

        参数:
            title: 会议标题.
            host_id: 主持人 ID.

        返回:
            Meeting: 创建成功的会议实体.

        异常:
            ValueError: 标题为空时抛出.
        """
        ...

    @staticmethod
    def validate_version(version: str) -> bool:
        """
        校验版本号格式.

        参数:
            version: 待校验的版本号字符串.

        返回:
            bool: True 符合规范, False 不符合.

        异常:
            无.
        """
        ...
```

---

## 8. 文件头模板

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: {实际文件名}
# 作者: wuhao
# 日期: {YYYY-MM-DD HH:MM:SS}
# 描述: {该文件的用途/功能简述，一句话概括}
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