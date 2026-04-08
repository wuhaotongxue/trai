# Audio_语音转写_(STT)

---

## 1. 工具定义

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | audio.transcribe |
| name | string | Speech_to_Text Transcription |
| description | string | Convert speech to text using ASR |
| category | string | audio |
| sub_category | string | transcription |
| risk_level | string | safe |
| monthly_quota_check | boolean | true |
| quota_type | string | transcription_minutes |
| audit_log | boolean | true |

### 1.1 参数定义

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| audio_path | string | 是 | - | 音频路径 |
| language | string | 否 | auto | 语言 |
| timestamps | boolean | 否 | true | 是否输出时间戳 |

---

## 2. 转写结果格式

| 字段 | 类型 | 说明 |
|------|------|------|
| text | string | 转写文本 |
| language | string | 检测语言 |
| duration_seconds | number | 音频时长 |
| segments | Segment[] | 分段结果 |
| confidence | number | 置信度 |

### 2.1 Segment 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| start | number | 开始时间 (秒) |
| end | number | 结束时间 (秒) |
| text | string | 文本 |

---

## 3. 月度配额

| 用户角色 | 配额/月 |
|---------|--------|
| Guest | 30 分钟 |
| User | 300 分钟 |
| VIP | 无限 |
| Admin | 无限 |

---

## 4. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>转写结果持久化存储无用户同意</li>
    <li>超过配额不拒绝操作</li>
    <li>转写内容不记录审计日志</li>
  </ul>
</div>
