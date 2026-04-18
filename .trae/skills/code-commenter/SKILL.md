---
name: "code-commenter"
description: >-
  为前端和后端的所有代码文件添加详细注释说明，包括函数、类、接口等。用户要求添加注释、解释代码或看不懂代码时调用。
---

# 代码注释自动添加器（code-commenter）

当调用此技能时，请严格按照以下步骤执行：

## 执行步骤

### 1. 识别需要注释的文件范围

遍历以下目录的所有代码文件：
- `backend/src/` 下的所有 `.py` 文件
- `client_electron/src/` 下的所有 `.ts` 和 `.tsx` 文件
- `frontend_next/src/` 下的所有 `.ts` 和 `.tsx` 文件（如果存在）

### 2. 检查文件是否已有文件头注释

确保每个文件顶部都有标准的文件头注释格式：

#### Python 文件头格式
```python
"""
文件名: <filename>.py
作者: wuhao
日期: <当前日期>
描述: <文件功能描述>
"""
```

#### TypeScript/TSX 文件头格式
```typescript
/**
 * 文件名: <filename>.ts
 * 作者: wuhao
 * 日期: <当前日期>
 * 描述: <文件功能描述>
 */
```

### 3. 为函数/方法添加 JSDoc/类型注释

#### Python 函数注释格式
```python
def function_name(param1: type, param2: type = default) -> return_type:
    """
    函数功能描述
    :param param1: 参数1描述
    :param param2: 参数2描述
    :return: 返回值描述
    """
    # 函数实现
```

#### TypeScript 函数/方法注释格式
```typescript
/**
 * 方法功能描述
 * @param param1 - 参数1描述
 * @param param2 - 参数2描述
 * @returns 返回值描述
 */
function functionName(param1: Type, param2: Type = defaultValue): ReturnType {
  // 函数实现
}
```

#### TypeScript 接口注释格式
```typescript
/**
 * 接口功能描述
 */
export interface InterfaceName {
  /** 属性描述 */
  propertyName: Type;
}
```

### 4. 为类添加类注释

#### Python 类注释
```python
class ClassName:
    """
    类功能描述
    """
    def method(self):
        """
        方法描述
        """
```

#### TypeScript 类注释
```typescript
/**
 * 类功能描述
 */
export class ClassName {
  /**
   * 方法描述
   * @param param - 参数描述
   */
  method(param: Type): void {
    // 实现
  }
}
```

### 5. 关键逻辑添加内联注释

- 在复杂的业务逻辑处添加简短注释
- 在正则表达式、数学公式等难以理解的代码处添加说明
- 在边界条件、特殊情况处理处添加说明

### 6. 遵循注释规范

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 严禁使用中文全角标点</strong>
  <div style="margin-top:8px;font-size:13px;">
    所有注释中使用英文半角标点（逗号、句号、问号、冒号等）
  </div>
</div>

### 7. 逐文件处理

从目标目录中逐个检查并修改文件：
1. 先读取文件内容
2. 检查并添加文件头
3. 检查并添加函数/类/接口注释
4. 保存修改后的文件

---

## 快速参考

| 文件类型 | 文件头位置 | 函数注释 | 接口/类注释 |
|---------|-----------|---------|-----------|
| .py | 文件顶部 | `"""` 多行字符串 | `"""` 多行字符串 |
| .ts/.tsx | 文件顶部 | `/**` JSDoc | `/**` JSDoc |

---

## 示例

### Python 注释示例
```python
"""
文件名: weather.py
作者: wuhao
日期: 2026-04-19
描述: 天气查询工具，集成 Open-Meteo API
"""

class WeatherTool:
    """天气工具类，提供天气查询功能"""
    
    async def get_weather(self, city: str) -> dict:
        """
        获取指定城市的天气信息
        :param city: 城市名称
        :return: 天气数据字典，包含温度、湿度等信息
        """
        # 通过地理编码获取城市坐标
        # 调用 Open-Meteo API 查询天气
        pass
```

### TypeScript 注释示例
```typescript
/**
 * 文件名: knowledge_base.ts
 * 作者: wuhao
 * 日期: 2026-04-19
 * 描述: 客户端知识库服务层，调用后端管理接口创建知识库
 */

export interface KnowledgeBaseDemoCreateRequest {
  /** 知识库内容 */
  content?: string | null;
  /** 文件名 */
  file_name?: string | null;
  /** 索引名称 */
  index_name?: string | null;
}

export const knowledge_base_service = {
  /**
   * 创建演示知识库
   * @param params - 知识库创建参数
   * @returns 创建结果，包含索引ID、文件ID等信息
   */
  async demo_create(params: KnowledgeBaseDemoCreateRequest) {
    // 实现
  }
};
```
