---
name: "code-commenter"
description: >-
  为客户端和前端的所有代码文件添加详细的注释说明，包括类、函数、接口、变量等，确保代码的可维护性。遍历 client_electron/src/ 和 frontend_next/src/ 下的所有 .ts 和 .tsx 文件。
---

# 代码注释自动添加器 (code-commenter)

## 执行步骤

### 1. 识别需要注释的文件范围
- `client_electron/src/` 下的所有 `.ts` 和 `.tsx` 文件
- `frontend_next/src/` 下的所有 `.ts` 和 `.tsx` 文件（如果存在）

### 2. 注释规则

#### 2.1 文件头部注释（必须）
每个文件的开头都必须包含完整的文件头部注释：
```typescript
/**
 * 文件名: xxx.tsx
 * 作者: wuhao
 * 日期: 2026-04-19 HH:MM:SS
 * 描述: 文件功能的详细描述
 */
```

#### 2.2 导出函数/变量注释
所有 `export` 导出的函数、变量、接口、类型都必须添加完整的 JSDoc 注释：
```typescript
/**
 * 函数功能描述
 * @param param1 - 参数1的说明
 * @param param2 - 参数2的说明
 * @returns 返回值的说明
 */
export const function_name = (param1: string, param2: number): string => {
  return 'result';
};
```

#### 2.3 接口注释
所有 interface 和 type 都必须添加完整的 JSDoc 注释：
```typescript
/**
 * 接口描述
 * @property property1 - 属性1的说明
 * @property property2 - 属性2的说明
 */
export interface InterfaceName {
  /** 属性1的说明 */
  property1: string;
  /** 属性2的说明 */
  property2: number;
}

/**
 * 类型别名描述
 */
export type TypeName = 'type1' | 'type2';
```

#### 2.4 类注释
所有类（class）都必须添加完整的 JSDoc 注释，包括每个方法和属性的注释：
```typescript
/**
 * 类功能描述
 */
export class ClassName {
  /**
   * 属性描述
   */
  private property: string;

  /**
   * 构造函数描述
   * @param param - 参数说明
   */
  constructor(param: string) {
    this.property = param;
  }

  /**
   * 方法描述
   * @param param - 参数说明
   * @returns 返回值说明
   */
  public method(param: number): string {
    return 'result';
  }
}
```

#### 2.5 React 组件注释
所有 React 组件都必须添加完整的 JSDoc 注释：
```typescript
/**
 * 组件功能描述
 * @param param1 - 参数1的说明
 * @param param2 - 参数2的说明
 * @returns React 组件
 */
export default function ComponentName({ param1, param2 }: { 
  param1: string;
  param2?: number;
}) {
  return <div>内容</div>;
}

/**
 * Hook 功能描述
 * @param param - 参数说明
 * @returns 返回值说明
 */
function useCustomHook(param: number) {
  return { value: param };
}
```

### 3. 遍历处理文件
按顺序遍历所有目标文件，逐个检查并添加注释。

### 4. 验证检查
完成注释后，运行项目的类型检查（如 `pnpm type-check`）确保没有错误。
