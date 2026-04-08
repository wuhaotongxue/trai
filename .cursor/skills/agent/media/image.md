# Agent - 图片处理规范

---

## 1. 图片能力矩阵

| 能力 | 工具 ID | 风险等级 | 水印 | VIP 跳过 | 审核 |
|------|---------|---------|------|---------|------|
| 图片发送 | image.message.send | safe | - | - | - |
| OCR | image.ocr | safe | - | - | - |
| 分类 | image.classify | safe | - | - | - |
| 审核 | image.moderate | monitored | - | - | - |
| 水印 | image.watermark.apply | safe | required | no | - |
| 文生图 | image.generate | approval | required | yes | required |
| 图生图 | image.transform | approval | required | yes | required |
| 缩略图 | image.thumbnail | safe | - | - | - |
| 人脸检测 | image.face.detect | safe | - | - | - |

---

## 2. 图片上下文

### 2.1 ImageAnalysisResult 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| image_id | string | 图片 ID |
| ocr_results | OCRResult[] | OCR 结果 (可选) |
| classification | ClassificationResult | 分类结果 (可选) |
| moderation | ModerationResult | 审核结果 (可选) |
| is_ai_generated | boolean | 是否 AI 生成 |
| watermark_applied | boolean | 是否已添加水印 |
| watermark_skipped | boolean | 是否被 VIP 跳过 |

---

## 3. 核心工具注册

| 工具 ID | 风险等级 | 需要审核 | 需要水印 | 水印可跳过 | 配额检查 | 审计日志 |
|---------|---------|---------|---------|-----------|---------|---------|
| image.generate | requires_approval | 是 | 是 | 是 | 是 | 是 |
| image.transform | requires_approval | 是 | 是 | 是 | 是 | 是 |
| image.watermark.apply | safe | - | - | no | - | 是 |
| image.moderate | monitored | - | - | - | - | 是 |

---

## 4. 图片 Rules

### 4.1 水印规则

| 规则 ID | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|---------|------|--------|
| IR-001 | AI 图片必须审核后才能展示 | tool_call: image.generate | require_confirmation | error |
| IR-002 | 非 VIP: AI 图片必须水印 | action: ai_image_generated | require_confirmation | error |
| IR-003 | VIP: 可跳过水印 | action: ai_image_generated | skip_watermark | info |

### 4.2 审核规则

| 规则 ID | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|---------|------|--------|
| IR-010 | 不安全图片必须阻止 (VIP 不可跳过审核) | tool_call: image.moderate | deny | error |

### 4.3 配额规则

| 规则 ID | 描述 | 触发条件 | 动作 | 严重程度 |
|---------|------|---------|------|--------|
| IR-020 | 非 VIP: 检查月度配额 | tool_call: image.generate | audit_log | warning |

---

## 5. 禁止事项

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>AI 生成图片不经过审核直接展示 (审核不可跳过，包括 VIP)</li>
    <li>非 VIP 用户跳过水印</li>
    <li>VIP 水印跳过逻辑硬编码 (必须在 RBAC 层统一管理)</li>
    <li>水印跳过无审计日志</li>
    <li>OCR 结果持久化存储无用户同意</li>
    <li>人脸图片跨用户共享无匿名化</li>
  </ul>
</div>

---

## 6. 快速参考

| 用户角色 | 水印 | 审核 | 配额 |
|---------|------|------|------|
| Guest | - | - | - |
| User | 必须 | 必须 | 有限 |
| VIP | 可跳过 | 必须 | 无限 |
| Admin | 可跳过 | 可跳过 | 无限 |
