# Audio_音频流

---

## 1. 工具定义

### 1.1 音频流推送

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | audio.stream.push |
| name | string | Push Audio Stream |
| description | string | Push synthesized audio to stream |
| category | string | audio |
| sub_category | string | streaming |
| risk_level | string | requires_approval |
| requires_watermark | boolean | true |
| watermark_skip_allowed | boolean | true |
| monthly_quota_check | boolean | true |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| audio_data | string | 是 | - | 音频数据 |
| stream_id | string | 是 | - | 流 ID |
| format | string | 否 | mp3 | 格式: mp3/wav/opus |

### 1.2 实时翻译

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | audio.translate_stream |
| name | string | Translate Audio Stream |
| description | string | Real-time speech translation |
| category | string | audio |
| sub_category | string | translation |
| risk_level | string | safe |
| monthly_quota_check | boolean | true |
| audit_log | boolean | true |

**参数定义**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| source_language | string | 是 | 源语言 |
| target_language | string | 是 | 目标语言 |
| stream_id | string | 是 | 流 ID |

---

## 2. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>音频流推送不经过水印</li>
    <li>VIP 水印跳过逻辑硬编码</li>
    <li>实时翻译无配额限制</li>
  </ul>
</div>
