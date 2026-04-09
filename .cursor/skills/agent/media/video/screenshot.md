# Video_视频截图

---

## 1. 工具定义

### 1.1 截图

|| 字段 | 类型 | 说明 |
||------|------|------|
|| id | string | video_screenshot |
|| name | string | Take Video Screenshot |
|| description | string | Capture a screenshot from video stream |
|| category | string | video |
|| sub_category | string | processing |
|| risk_level | string | safe |
|| audit_log | boolean | true |

**参数定义**：

|| 参数名 | 类型 | 必填 | 默认值 | 说明 |
||--------|------|------|--------|------|
|| video_id | string | 是 | - | 视频 ID |
|| timestamp | number | 是 | - | 时间戳 (秒) |
|| format | string | 否 | png | 格式: png/jpg |

### 1.2 水印工具

|| 字段 | 类型 | 说明 |
||------|------|------|
|| id | string | video_watermark_apply |
|| name | string | Apply Video Watermark |
|| description | string | Add watermark to video (AI generated required) |
|| category | string | video |
|| sub_category | string | processing |
|| risk_level | string | safe |
|| requires_watermark | boolean | true |
|| watermark_skip_allowed | boolean | false |
|| audit_log | boolean | true |

**参数定义**：

|| 参数名 | 类型 | 必填 | 默认值 | 说明 |
||--------|------|------|--------|------|
|| video_id | string | 是 | - | 视频 ID |
|| watermark_type | string | 是 | - | 水印类型: ai_generated/trai_logo |
|| position | string | 否 | bottom_right | 位置 |

### 1.3 内容审核

|| 字段 | 类型 | 说明 |
||------|------|------|
|| id | string | video_moderate |
|| name | string | Moderate Video Content |
|| description | string | Check video for unsafe or inappropriate content |
|| category | string | video |
|| sub_category | string | moderation |
|| risk_level | string | monitored |
|| audit_log | boolean | true |

**参数定义**：

|| 参数名 | 类型 | 必填 | 默认值 | 说明 |
||--------|------|------|--------|------|
|| video_id | string | 是 | - | 视频 ID |
|| check_categories | array | 否 | all | 检查类别 |

---

## 2. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>截图不记录审计日志</li>
    <li>水印类型选择错误</li>
    <li>不安全视频不阻止直接展示</li>
  </ul>
</div>
