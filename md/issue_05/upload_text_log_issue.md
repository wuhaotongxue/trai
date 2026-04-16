# 知识库长文本上传日志污染问题 (Issue 05)

## 1. 异常日志回溯

我们在控制台看到了如下这段很长的审计日志（Audit Log）：

```json
2026-04-16 14:35:44.475 | INFO | api.middleware.audit:log:174 | AUDIT: {
  "action": "admin_action",
  "method": "POST",
  "path": "/api/admin/knowledge_base/indices/fuze7dsa7n/files/upload_text",
  "request_body": {
    "file_name": "接口说明.md",
    "content": "获取指定业务空间下知识库列表。\r\n\r\n## 接口说明\r\n\r\n- RAM 用户（子账号）需要首先获取阿里云百炼的...[truncated]"
  }
}
```

## 2. 这是哪个接口？为什么会这样？

**接口名称**：`POST /api/admin/knowledge_base/indices/{index_id}/files/upload_text` （客户端用于将文本文件上传到知识库的接口）。

**原因分析**：
1. TRAI 后端全局配置了 **审计日志中间件 (`AuditMiddleware`)**，它会拦截所有发往 `/api/admin/` 的请求，并将请求体 (`request_body`) 记录下来，方便日后做操作审计。
2. 在客户端点击“上传文件”时，客户端将 `.md` 或 `.txt` 文件的**全部文本内容**塞进了 `content` 字段发给后端。
3. 审计中间件在记录日志时，虽然有一个“最长 500 字符截断”的兜底机制（即日志末尾看到的 `...[truncated]`），但 500 个字符在终端中依然会占据数十行屏幕空间，导致日志“刷屏”，严重影响开发调试，也浪费了日志存储空间。

## 3. 解决办法

为了彻底解决这种“大文本内容”污染日志的问题，我们需要在审计日志记录器中针对性地进行“脱敏/隐藏”处理。

**修改文件**：`backend/src/api/middleware/audit.py`

**处理逻辑**：
在 `AuditLogger._mask_sensitive` （敏感信息掩码）方法中，新增一条专门针对长文本内容的判断规则。如果发现请求体字典中存在键名为 `content`，并且它的字符串长度超过 100，我们就将其替换为标识符 `***FILE_CONTENT_HIDDEN***`。

```python
# 修改前：只处理密码等字段和 500 字符截断
elif isinstance(value, str) and len(value) > 500:
    masked[key] = value[:500] + "...[truncated]"

# 修改后：提前拦截 content 字段
elif key.lower() == "content" and isinstance(value, str) and len(value) > 100:
    masked[key] = "***FILE_CONTENT_HIDDEN***"
elif isinstance(value, str) and len(value) > 500:
    masked[key] = value[:500] + "...[truncated]"
```

这样修改后，以后不管客户端上传几 MB 的文本文件，审计日志里记录的 `request_body` 都会变成简洁的：
`"request_body": {"file_name": "xxx.md", "content": "***FILE_CONTENT_HIDDEN***"}`，彻底告别刷屏烦恼。

## 4. 冗余文件清理

借此机会，已将之前排查问题时产生的一系列不需要的临时测试文件全部删除，保持代码库整洁：
- `接口说明.md`
- `知识库API测试指南.md`
- `backend/scripts/direct_test.py`
- `backend/scripts/knowledge_base_list_indices.py`
- `backend/scripts/knowledge_base_workflow_check.py`
