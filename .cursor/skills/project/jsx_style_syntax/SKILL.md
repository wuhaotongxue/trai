# JSX Style 语法规范

## 规则

在 JSX 中使用 `style` 属性时，**必须使用双引号包裹整个对象**，CSS 属性之间用**逗号分隔**，每个属性的值用**单引号包裹**。

## 正确写法

```tsx
<div style={{ position: 'fixed', top: '50%', left: '50%' }}>
  内容
</div>
```

## 常见错误

### ❌ 错误：逗号位置错误

```tsx
// 错误：position 属性的值后面用了逗号而不是单引号+逗号
<div style={{ position: 'fixed, top: '50%' }}>

// 错误：缺少属性间的逗号
<div style={{ position: 'fixed' top: '50%' }}>
```

### ✅ 正确：完整的属性分隔

```tsx
// 正确：每个 CSS 属性之间用逗号分隔
<div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
```

## 记忆口诀

> style 属性用双括号，外层大括号内对象，属性之间用逗号，属性值用单引号

## 完整示例

```tsx
// 完整的测试调试元素
<div style={{
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'red',
  color: 'white',
  padding: '20px',
  fontSize: '24px',
  zIndex: 9999
}}>
  测试文本
</div>
```

## 为什么容易出错

1. CSS 原生写法是 `property: value;`（分号分隔）
2. JSX style 是 JavaScript 对象，语法是 `property: 'value',`（逗号分隔）
3. 混用两种语法是常见错误根源

## 检查清单

写完 style 后快速检查：
- [ ] 整个 style 值被 `{{ }}` 包裹
- [ ] 每个 CSS 属性用逗号 `,` 结尾（不是分号）
- [ ] 属性值用单引号 `'value'` 或双引号 `"value"` 包裹
- [ ] 多个属性之间用逗号分隔
