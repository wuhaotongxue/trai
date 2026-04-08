# Video - AI 视频生成

---

## 1. 工具定义

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | video.generate |
| name | string | Generate Video from Text/Image |
| description | string | Generate video using AI from text prompt or image |
| category | string | video |
| sub_category | string | ai_generation |
| risk_level | string | requires_approval |
| requires_watermark | boolean | true |
| watermark_skip_allowed | boolean | true |
| requires_ai_content_review | boolean | true |
| monthly_quota_check | boolean | true |
| audit_log | boolean | true |

### 1.1 参数定义

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| prompt | string | 是 | - | 视频描述 (最大 2000 字符) |
| source_image_id | string | 否 | - | 源图片 ID |
| duration | number | 否 | 5 | 视频时长 (1-60 秒) |
| style | string | 否 | - | 视频风格 |

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
    <li>AI 生成视频不经过内容审核直接展示</li>
    <li>VIP 水印跳过逻辑硬编码</li>
    <li>视频生成无月度配额限制</li>
    <li>超过 60 秒的视频不拒绝</li>
  </ul>
</div>
