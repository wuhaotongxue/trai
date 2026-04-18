---
name: "naming-convention"
description: >-
  TRAI 命名规范，统一使用 snake_case，禁止 kebab-case 用于文件和目录命名
---

# TRAI 命名规范

## 文件和目录命名规范

### 强制要求

1. **文件和目录名统一使用 snake_case（下划线连接）**
   - ✅ 正确：`text_to_image`、`image_to_image`、`not_found.tsx`
   - ❌ 禁止：`text-to-image`、`image-to-image`、`not-found.tsx`

2. **路由路径也使用 snake_case**
   - ✅ 正确：`/ai/text_to_image`、`/ai/image_to_image`
   - ❌ 禁止：`/ai/text-to-image`、`/ai/image-to-image`

3. **组件和类型使用 PascalCase**
   - ✅ 正确：`TextToImage`、`ImageToImage`
   - ❌ 禁止：`text-to-image`、`image-to-image`

4. **变量和函数使用 camelCase**
   - ✅ 正确：`textToImage`、`imageToImage`
   - ❌ 禁止：`text-to-image`、`image-to-image`

## 执行步骤

### 1. 检查所有文件和目录
- 检查 `client_electron/src/` 下的所有文件和目录
- 检查 `frontend_next/src/` 下的所有文件和目录

### 2. 重命名不符合规范的文件和目录
- 使用 `mv` 命令将 kebab-case 重命名为 snake_case
- 例如：`text-to-image -> text_to_image`

### 3. 更新所有引用
- 更新导入语句
- 更新路由配置
- 更新组件引用
- 更新侧边栏导航

### 4. 验证
- 运行 `pnpm type-check` 确保没有类型错误
- 检查所有功能正常工作
