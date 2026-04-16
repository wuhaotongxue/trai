# 知识库长文本上传日志污染问题 (Issue 05)

## 问题描述

在客户端上传文件到知识库时，会调用后端的文本上传接口。后端的审计中间件 (`AuditMiddleware`) 拦截并记录了该请求的详细信息。

**具体接口**：
`POST /api/admin/knowledge_base/indices/{index_id}/files/upload_text`

由于该接口的请求体 (`request_body`) 中包含 `content` 字段，其值为整个上传文件（如 `.md` 文件）的完整文本内容，审计日志系统默认会将前 500 个字符输出到终端和日志文件中（`...[truncated]`）。这会导致单条日志占据大量的终端屏幕行数，造成“刷屏”现象，严重影响开发调试，并增加了日志文件的体积。

## 解决办法

为了保持日志的整洁并节约存储空间，我们需要在后端的审计日志拦截器中，对这类大文本内容进行专门的“脱敏”或截断处理。

**具体修改步骤：**

1. **定位日志处理逻辑**：打开后端的 `backend/src/api/middleware/audit.py` 文件。
2. **增加敏感/大文本字段过滤**：在 `AuditLogger._mask_sensitive` 方法中，识别出键名为 `content` 的字段。
3. **内容替换**：当发现 `content` 字段且内容较长时，直接将其值替换为 `***FILE_CONTENT_HIDDEN***`（或者其他脱敏标识），而不是保留前 500 个字符。这样就可以确保无论上传的文件有多大，在终端输出的审计日志中只占极小的一段。

## 清理多余文件

为了保持项目的整洁，已经在本次修复中删除了之前由于测试和说明而生成的各种临时文件，包括但不限于：
- 根目录下的 `接口说明.md`
- 根目录下的 `知识库API测试指南.md`
- 后端测试脚本 `backend/scripts/direct_test.py`
- 后端测试脚本 `backend/scripts/knowledge_base_list_indices.py`
- 后端测试脚本 `backend/scripts/knowledge_base_workflow_check.py`

这些脚本的使命已经完成，项目代码已全部恢复干净状态。
