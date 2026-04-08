---
name: "naming-convention-spec"
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
