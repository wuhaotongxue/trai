___
name: "backend_rules"
description: "TRAI 鍚庣寮€鍙戣鑼冦€傚己鍒舵墽琛?DDD 5灞傛灦鏋勩€佺被灏佽瑙勮寖銆佹枃浠跺ご瑙勮寖銆佷腑鏂囨爣鐐圭浠ゃ€?
___

# Backend_寮€鍙戣鑼?

## 蹇€熺储寮?

| 瀛愯鑼?| 璺緞 | 瑙﹀彂鍦烘櫙 |
|________|______|__________|
| Python 瑙勮寖 | `rules/python.md` | 蹇呰 |
| 鏁版嵁搴撹鑼?| `rules/database.md` | 鏂板 Model 鏃?|
| API 璁捐瑙勮寖 | `api_design/routes.md` | 鏂板 API 鏃?|
| S3 瀛樺偍涓庤闂帶鍒?| `storage/s3_access.md` | 娑夊強鏂囦欢涓婁紶/涓嬭浇鏃?|
| DDD 浜斿眰鏋舵瀯 | `architecture/layered.md` | 蹇呰 |

## 鏍稿績瑙勫垯

### 1. 涓枃鏍囩偣绂佷护 (CRITICAL)
_ **缁濆绂佹**鍦ㄤ唬鐮佸拰娉ㄩ噴涓嚭鐜颁腑鏂囧叏瑙掓爣鐐?(`锛宍銆乣銆俙銆乣锛乣銆乣锛歚)
_ 蹇呴』浣跨敤鑻辨枃鍗婅鏍囩偣 (`,`, `.`, `!`, `:`)

### 2. Python_3_13 鐜
_ 鏍囧噯鐜锛歚trai31313` (Conda)
_ 寮哄埗浣跨敤 `|` 鏇夸唬 `Union`/`Optional`
_ 缂╄繘 4 涓┖鏍?

### 3. 寮哄埗绫诲皝瑁呬笌 DDD 鍒嗗眰
_ **姣忎釜 .py 鏂囦欢蹇呴』鏈夌被**
_ **鎵€鏈夊嚱鏁板繀椤诲皝瑁呭湪绫讳腑**
_ 绂佹鏂囦欢椤跺眰瀛ょ珛鍑芥暟

### 4. API 璁捐瑙勮寖
_ 涓氬姟鎺ュ彛寮哄埗浠呬娇鐢?**POST**
_ 缁熶竴鍝嶅簲鏍煎紡: `{"code": 200, "msg": "OK", "data": {}, "req_id": "...", "ts": "..."}`

### 5. 鏁版嵁搴撹鑼?
_ 琛ㄥ悕: 澶嶆暟 snake_case
_ 涓婚敭: UUID 鎴?BigInt Identity (绂佹 Serial)
_ 蹇呭瀛楁: `created_at`, `updated_at`, `is_deleted`

### 6. 鏂囦欢澶存ā鏉?(MANDATORY)
```python
#!/usr/bin/env python
# _*_coding:_utf_8_*_
# 鏂囦欢鍚?_{瀹為檯鏂囦欢鍚峿
# 浣滆€?_wuhao
# 鏃ユ湡:_{YYYY_MM_DD_HH:MM:SS}
# 鎻忚堪:_{璇ユ枃浠剁殑鐢ㄩ€?鍔熻兘绠€杩帮紝涓€鍙ヨ瘽姒傛嫭}
```

### 7. Docstring 鍏ㄨ鐩?
_ 姣忎釜 `class`銆佹瘡涓?`def`/`async def` 蹇呴』鏈変腑鏂?docstring
_ 鍐呭: 鐢ㄩ€?+ 鍙傛暟 + 杩斿洖鍊?+ 寮傚父

### 8. 瀹夊叏绾㈢嚎
_ 蹇呴』浣跨敤 `passlib` + `bcrypt`/`Argon2` 鍝堝笇瀵嗙爜
_ 涓ョ鍦ㄦ棩蹇椾腑璁板綍鏄庢枃瀵嗙爜鎴?Token
_ **涓ョ S3 璧勬簮 Public_Read**锛屽繀椤婚€氳繃 Presigned_URL 璁块棶 (璇﹁ `storage/s3_access.md`)
_ **浼佷笟寰俊绂佹鐢ㄦ埛鍚嶅瘑鐮佺櫥褰?*锛屼粎鏀寔鎵爜鐧诲綍 (SSO)锛屽惁鍒欒涓烘櫘閫氱敤鎴?
_ **浼佷笟寰俊鎵爜鐧诲綍鑷姩鎺堜簣 `wecom_vip` 鏉冮檺**锛堢瓑鍚屼簬 VIP 浼氬憳鏈夋晥鏈燂級
_ **EXE 鏇存柊涓嶅奖鍝?S3 鏉冮檺**锛屾潈闄愭帶鍒朵粎鍦?Backend 渚?
_ **澶氱鎴峰己鍒堕殧绂?*锛氭瘡娆?S3 璁块棶蹇呴』鏍￠獙 `tenant_id`锛岀姝㈣法绉熸埛璁块棶
_ **涓婁紶蹇呴』鍙岄噸鏍￠獙**锛欳ontent_Type + 鎵╁睍鍚嶅悓鏃堕€氳繃鎵嶅厑璁镐笂浼?
_ **鍙墽琛屾枃浠剁姝笂浼?*锛歚.exe/.sh/.py/.js/.jar/.dll/.so` 鍙婂搴?MIME 绫诲瀷涓€寰嬫嫆缁?
_ **涓嬭浇蹇呴』闄愭祦**锛氭瘡娆＄鍙?Presigned_URL 鍓嶅厛妫€鏌ユ粦鍔ㄧ獥鍙ｉ檺娴?
_ **S3 鎿嶄綔鍏ㄩ噺瀹¤**锛欸etObject/PutObject/DeleteObject 鍏ㄩ儴璁板綍缁撴瀯鍖栨棩蹇?
_ **AI 鍐呭蹇呴』瀹℃牳**锛氭枃鐢熷浘/鍥剧敓瑙嗛鐢熸垚鍚庡繀椤荤粡杩囧唴瀹瑰畨鍏ㄥ鏍告墠鑳藉睍绀?
_ **AI 鏈嶅姟鐩翠紶瀹夊叏**锛歅resigned_PUT_URL 鏈夋晥鏈?鈮?300 绉掞紝鏍￠獙 x_amz_expected_bucket_owner
_ **AI 鏈堥厤棰濇帶鍒?*锛氱敤鎴锋彁浜?AI 浠诲姟鍓嶅繀椤绘牎楠屾湀搴﹂厤棰濓紝瓒呴鎷掔粷
