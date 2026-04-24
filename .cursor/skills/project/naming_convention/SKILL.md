---
name: "naming-convention"
description: "TRAI 项目命名规范。强制所有代码（前端/后端/客户端）使用 snake_case 命名法，禁止 kebab-case（中间横杠）。创建或修改任何代码文件时立即应用此规范。"
---

# TRAI_项目命名规范（snake_case_强制）

## 核心规则

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 强制要求</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;">
    <li>所有标识符必须使用 <code>snake_case</code>（纯小写+下划线）</li>
    <li><strong>禁止 kebab-case</strong>（中间横杠如 <code>add-num</code>、<code>meeting-analytics</code>）</li>
    <li>禁止 camelCase 用于变量/函数名</li>
  </ul>
</div>

---

## Python 后端

### 文件名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 通用文件 | `meetingExportService.py` | `meeting_export_service.py` |
| 迁移文件 | `addMeetingExports.py` | `add_meeting_exports.py` |

**规则**：全小写，单词间用 `_` 分隔。

### 类名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 类名 | `class meetingExport` | `class MeetingExport` (PascalCase) |

**规则**：类名用 PascalCase，这是 Python 唯一允许的大写形式。

### 函数 / 方法名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 函数 | `def batchCreateRecord()` | `def batch_create_record()` |
| 函数 | `def getMeetingDetail()` | `def get_meeting_detail()` |

**规则**：函数名全小写，单词间用 `_`。

### 变量名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 变量 | `totalNumRecords` | `total_num_records` |
| 变量 | `meetingID` | `meeting_id` |
| 变量 | `isProcessing` | `is_processing` |

### API 路由（FastAPI）

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 路由 | `/meeting/export-pdf` | `/meeting/export/pdf` |

**路由路径**：推荐全小写，单词间用 `/` 分隔。

---

## 前端 TypeScript / Next.js

### 文件名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 组件文件 | `meeting-analytics-dashboard.tsx` | `meeting_analytics_dashboard.tsx` |
| 组件文件 | `audioUploadDialog.tsx` | `audio_upload_dialog.tsx` |
| Hook 文件 | `useMeetingStats.ts` | `use_meeting_stats.ts` |

**规则**：`.tsx`/`.ts` 文件名全小写+下划线。React 组件文件也用 snake_case。

### 目录名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 目录 | `meeting-analytics/` | `meeting_analytics/` |

### 变量名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 变量 | `totalRecords` | `total_records` |
| 变量 | `meetingId` | `meeting_id` |
| 变量 | `isLoading` | `is_loading` |

### 函数名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 函数 | `handleCreateMeeting` | `handle_create_meeting` |
| 函数 | `fetchMeetingList` | `fetch_meeting_list` |

### React 组件名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 组件名 | `MeetingAnalyticsDashboard` | `MeetingAnalyticsDashboard` (PascalCase) |

**规则**：React 组件在 JSX 中使用 PascalCase。

---

## 数据库

### 表名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 表名 | `MeetingExports` | `meeting_exports` |

### 列名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 列名 | `exportFormat` | `export_format` |
| 列名 | `createdAt` | `created_at` |
| 列名 | `meetingID` | `meeting_id` |

---

## 立即执行清单

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">文件名</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全小写+下划线</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">变量名/函数名</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全小写+下划线</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">类名/组件名</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">PascalCase</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">API 路径</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全小写+下划线</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">JSON 字段</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全小写+下划线</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 kebab</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">add-num / export-pdf</div>
  </div>

</div>

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 禁止形式</strong>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    <code>add-num</code> / <code>meeting-analytics</code> / <code>export-pdf</code> / <code>batch-create</code>
  </div>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    一律改为下划线形式：<code>add_num</code> / <code>meeting_analytics</code> / <code>export_pdf</code>
  </div>
</div>

---

## 变量命名语义化规范 (CRITICAL)

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止单字母变量名</strong>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    除以下特殊情况外，禁止使用单字母变量名（<code>t</code>、<code>i</code>、<code>j</code>、<code>k</code> 等）
  </div>
</div>

### 翻译函数命名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 翻译函数 | `const t = useI18n()` | `const translate = useI18n()` |
| 翻译函数调用 | `t("key")` | `translate("key")` |
| 定时器变量 | `const t = setTimeout(...)` | `const timer = setTimeout(...)` |

### 循环变量命名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| 简单循环 | `for (let i = 0; ...)` | `for (let index = 0; ...)` 或 `for (const item of items)` |
| 嵌套循环 | `for (let i = 0; ...)` | `for (let row_idx = 0; ...)` / `for (let col_idx = 0; ...)` |
| 数组遍历 | `arr.map(i => ...)` | `arr.map(item => ...)` 或 `arr.map((item, index) => ...)` |

### 回调函数命名

| 类型 | ❌ 禁止 | ✅ 正确 |
|------|---------|---------|
| Promise | `.then(t => ...)` | `.then(result => ...)` |
| 数组 | `.filter(i => ...)` | `.filter(user => ...)` |
| 事件 | `onClick={(e) => ...}` | `onClick={(event) => ...}` |

### 特殊情况豁免

以下场景可使用简短命名：
- 极简数组推导：`[1,2,3].map(x => x * 2)` 中的 `x`
- 临时交换变量：`[a, b] = [b, a]` 中的 `a`、`b`
- 数学公式中的标准符号：`x`、`y`、`z` 坐标；`r` 半径等

### 审查检查清单

| 检查项 | 说明 |
|--------|------|
| 翻译函数 | 必须是 `translate`，禁止 `t` |
| 定时器 | 必须是 `timer` 或 `timeout_id`，禁止 `t` |
| 循环变量 | 必须是 `index`、`item` 等语义化名称，禁止 `i`、`j` |
| 回调参数 | 必须是 `result`、`user`、`item` 等，禁止 `r`、`u` |