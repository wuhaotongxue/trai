# 知识库接口测试指南

这篇文档提供了当前可用的知识库 API 的 `curl` 测试示例。由于所有接口都需要管理员权限，你需要先调用登录接口获取 `access_token`，并在后续请求的 `Authorization` 头中携带该 token。

## 1. 登录获取 Token

```bash
curl -X POST "http://127.0.0.1:5666/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

假设返回的 `access_token` 为 `<YOUR_TOKEN>`，请将其替换到下面示例的 `<YOUR_TOKEN>` 处。

---

## 2. 知识库相关接口

### 2.1 获取知识库分类列表

获取阿里云百炼工作空间下的分类列表。

```bash
curl -X GET "http://127.0.0.1:5666/api/admin/knowledge_base/categories" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 2.2 获取知识库列表 (Indices)

获取指定工作空间下的所有知识库（索引）列表。

```bash
curl -X GET "http://127.0.0.1:5666/api/admin/knowledge_base/indices" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 2.3 创建知识库 Demo

创建一个名为 `trai_demo_xxx` 的知识库，并上传一段内置的 Markdown 文本作为测试文件。

```bash
# 使用默认配置创建
curl -X POST "http://127.0.0.1:5666/api/admin/knowledge_base/demo_create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d "{}"

# 或者指定知识库名称
curl -X POST "http://127.0.0.1:5666/api/admin/knowledge_base/demo_create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"index_name": "my_test_kb"}'
```

### 2.4 获取知识库文件列表

获取某个具体知识库（`<INDEX_ID>`）下的所有文件。需要将 `<INDEX_ID>` 替换为你从上一步获取到的知识库 ID。

```bash
curl -X GET "http://127.0.0.1:5666/api/admin/knowledge_base/indices/<INDEX_ID>/files" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 2.5 上传文本到知识库

向指定知识库上传一段自定义文本并触发增量解析。

```bash
curl -X POST "http://127.0.0.1:5666/api/admin/knowledge_base/indices/<INDEX_ID>/files/upload_text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "file_name": "test_doc.md",
    "content": "# 测试文档\n这是一段用于测试上传的文本。"
  }'
```

### 2.6 修改知识库名称

修改现有知识库的名称。

```bash
curl -X PUT "http://127.0.0.1:5666/api/admin/knowledge_base/indices/<INDEX_ID>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"index_name": "new_kb_name"}'
```

### 2.7 删除知识库文件

从知识库中删除指定文件。需要提供 `<INDEX_ID>` 和 `<FILE_ID>`。

```bash
curl -X DELETE "http://127.0.0.1:5666/api/admin/knowledge_base/indices/<INDEX_ID>/files/<FILE_ID>" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 2.8 删除知识库

删除整个知识库。

```bash
curl -X DELETE "http://127.0.0.1:5666/api/admin/knowledge_base/indices/<INDEX_ID>" \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```
