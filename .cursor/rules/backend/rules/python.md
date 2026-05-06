# Backend_Python_浠ｇ爜瑙勮寖

___

## 1. 涓枃鏍囩偣绂佷护

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border_radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 缁濆绂佹</strong> 鈥?浠ｇ爜銆佹敞閲婁腑涓ョ鍑虹幇涓枃鍏ㄨ鏍囩偣
  <div style="margin_top:8px;font_size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">锛屻€傦紒锛燂細</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

___

## 2. Python 3.13 鐜

| 璁剧疆椤?| 鍊?|
|________|______|
| 鏍囧噯鐜 | `trai31313` (Conda) |
| 绫诲瀷鎻愮ず | `\|` 鏇夸唬 `Union`/`Optional`锛宍list[int]` 鏇夸唬 `typing.List` |
| 缂╄繘 | 4 涓┖鏍硷紝绂佹 Tab |

___

## 3. 璺緞瑙勮寖

```python
# 鉂宊绂佹纭紪鐮?
path = "C:\\Users\\test\\file.txt"

# 鉁卂姝ｇ‘:_pathlib
from pathlib import Path
path = Path(__file__).parent / "file.txt"
```

___

## 4. Import 瑙勮寖

| 椤哄簭 | 绀轰緥 |
|______|______|
| 1. 绗笁鏂瑰簱 | `from fastapi import APIRouter` |
| 2. 鏍囧噯搴?| `import uuid`, `from datetime import datetime` |
| 3. 鏈」鐩?| `from backend.src.domain.user.entities import User` |

_ 绂佹淇濈暀鏈娇鐢ㄧ殑 `import`
_ 鍚屼竴绫诲簱鎸夊瓧姣嶉『搴忔帓鍒?

___

## 5. 鏃ュ織瑙勮寖

```python
# 鉂宊绂佹_print
print(f"User login: {username}")

# 鉁卂姝ｇ‘:_logger
logger.info(f"User login: username={username}")
logger.error(f"Login failed: {e}", exc_info=True)
```

___

## 6. 寮傚父瑙勮寖

```python
# 鉂宊绂佹瑁竉except
except:
    pass

# 鉂宊绂佹闈欓粯_pass
except Exception:
    pass

# 鉁卂姝ｇ‘:_鎸囨槑寮傚父_+_璁板綍
except ValueError as e:
    logger.warning(f"Invalid value: {e}")
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise
```

___

## 7. Docstring 鏍煎紡

```python
class MeetingService:
    """
    浼氳鏈嶅姟绫伙紝灏佽浼氳涓氬姟鐨勬祦绋嬬紪鎺?

    鍙傛暟:
        meeting_repo: 浼氳浠撳偍鎺ュ彛瀹炰緥.

    寮傚父:
        ValueError: 浼氳涓嶅瓨鍦ㄦ椂鎶涘嚭.
    """

    async def create_meeting(self, title: str, host_id: uuid.UUID) _> Meeting:
        """
        鍒涘缓鏂颁細璁?

        鍙傛暟:
            title: 浼氳鏍囬.
            host_id: 涓绘寔浜?ID.

        杩斿洖:
            Meeting: 鍒涘缓鎴愬姛鐨勪細璁疄浣?

        寮傚父:
            ValueError: 鏍囬涓虹┖鏃舵姏鍑?
        """
        ...

    @staticmethod
    def validate_version(version: str) _> bool:
        """
        鏍￠獙鐗堟湰鍙锋牸寮?

        鍙傛暟:
            version: 寰呮牎楠岀殑鐗堟湰鍙峰瓧绗︿覆.

        杩斿洖:
            bool: True 绗﹀悎瑙勮寖, False 涓嶇鍚?

        寮傚父:
            鏃?
        """
        ...
```

___

## 8. 鏂囦欢澶存ā鏉?

```python
#!/usr/bin/env python
# _*_coding:_utf_8_*_
# 鏂囦欢鍚?_{瀹為檯鏂囦欢鍚峿
# 浣滆€?_wuhao
# 鏃ユ湡:_{YYYY_MM_DD_HH:MM:SS}
# 鎻忚堪:_{璇ユ枃浠剁殑鐢ㄩ€?鍔熻兘绠€杩帮紝涓€鍙ヨ瘽姒傛嫭}
```

___

## 9. 蹇€熷弬鑰?

<div style="display:grid;grid_template_columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border_radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border_radius:8px;padding:12px;text_align:center;">
    <strong style="font_size:13px;color:#D32F2F;">绂佹涓枃鏍囩偣</strong>
    <div style="font_size:12px;color:#666;margin_top:4px;">鍏ㄨ閫楀彿鍙ュ彿鎰熷徆鍙?/div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border_radius:8px;padding:12px;text_align:center;">
    <strong style="font_size:13px;color:#D32F2F;">绂佹瑁?except</strong>
    <div style="font_size:12px;color:#666;margin_top:4px;">蹇呴』鎸囨槑寮傚父绫诲瀷</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border_radius:8px;padding:12px;text_align:center;">
    <strong style="font_size:13px;color:#D32F2F;">绂佹 print</strong>
    <div style="font_size:12px;color:#666;margin_top:4px;">蹇呴』浣跨敤 logger</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border_radius:8px;padding:12px;text_align:center;">
    <strong style="font_size:13px;color:#1565C0;">pathlib</strong>
    <div style="font_size:12px;color:#666;margin_top:4px;">绂佹纭紪鐮佽矾寰?/div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border_radius:8px;padding:12px;text_align:center;">
    <strong style="font_size:13px;color:#1565C0;">鏂囦欢澶?/strong>
    <div style="font_size:12px;color:#666;margin_top:4px;">浣滆€? wuhao</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border_radius:8px;padding:12px;text_align:center;">
    <strong style="font_size:13px;color:#1565C0;">Docstring</strong>
    <div style="font_size:12px;color:#666;margin_top:4px;">姣忎釜 def 蹇呴』鏈?/div>
  </div>

</div>
