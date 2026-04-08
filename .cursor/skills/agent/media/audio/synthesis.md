# Audio_语音合成__TTS_

---

## 1. 工具定义

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | audio.synthesize |
| name | string | Text-to-Speech Synthesis |
| description | string | Convert text to natural speech using AI |
| category | string | audio |
| sub_category | string | synthesis |
| risk_level | string | safe |
| requires_watermark | boolean | true |
| watermark_skip_allowed | boolean | true |
| monthly_quota_check | boolean | true |
| audit_log | boolean | true |

### 1.1 参数定义

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| text | string | 是 | - | 文本内容 (最大 5000 字符) |
| voice_id | string | 否 | default | 声音 ID |
| language | string | 否 | auto | 语言 |
| speed | number | 否 | 1.0 | 语速 (0.5-2.0) |

---

## 2. 水印处理

| 用户角色 | 水印处理 |
|---------|---------|
| VIP | 可跳过水印 |
| Admin | 可跳过水印 |
| 其他 | 必须添加水印 |

---

## 3. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>AI 生成音频不经过水印直接展示</li>
    <li>VIP 水印跳过逻辑硬编码</li>
    <li>语音合成无月度配额限制</li>
    <li>超过 5000 字符的文本不截断</li>
  </ul>
</div>
