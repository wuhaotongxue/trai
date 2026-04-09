# 命名规范_snake_case_强制

## 核心规则

**所有标识符（变量/函数/文件名/路由/API路径）必须使用 snake_case（纯小写+下划线），禁止 kebab_case（中间横杠如 `add_num`、`meeting_analytics`）。**

## Python 后端

### 文件名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `meeting_analytics.py` | `meeting_analytics.py` |
| `meeting_export_service.py` | `meeting_export_service.py` |

规则：全小写，单词间用 `_` 分隔。

### 类名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `class MeetingExportService` | `class MeetingExportService` ✓（PascalCase，正确） |

规则：类名用 PascalCase。

### 函数 / 方法名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `def batchCreateRecord()` | `def batch_create_record()` |
| `def getMeetingDetail()` | `def get_meeting_detail()` |

### 变量名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `totalNumRecords` | `total_num_records` |
| `meetingID` | `meeting_id` |

## 前端 TypeScript / Next.js

### 文件名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `meeting-analytics-dashboard.tsx` | `meeting_analytics_dashboard.tsx` |
| `useMeetingStats.ts` | `use_meeting_stats.ts` |

### 变量名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `totalRecords` | `total_records` |
| `meetingId` | `meeting_id` |

### React 组件名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `MeetingAnalyticsDashboard` | `MeetingAnalyticsDashboard` ✓（PascalCase，正确） |

## 数据库

### 表名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `MeetingExports` | `meeting_exports` |

### 列名
| ❌ 禁止 | ✅ 正确 |
|---------|---------|
| `exportFormat` | `export_format` |
| `createdAt` | `created_at` |

## 立即执行清单

创建或修改任何文件时：

1. **文件名**：全小写+下划线
2. **变量名/函数名**：全小写+下划线
3. **类名**：PascalCase（Python/TypeScript 组件）
4. **API 路径**：全小写+下��线
5. **JSON 字段**：全小写+下划线

**禁止出现任何 kebab-case**：`add-num`、`meeting-analytics`、`export-pdf` 等形式一律改为下划线形式。