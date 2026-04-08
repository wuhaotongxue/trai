# Frontend Next - TypeScript 规范

---

## 1. 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释、UI 文案中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. 类型规范

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 必须显式声明类型</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li><code>interface</code> / <code>type</code> 定义数据结构</li>
      <li>组件 Props 必须定义接口</li>
      <li>API 响应必须定义类型</li>
      <li>函数必须声明返回类型</li>
    </ul>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 严禁使用 any</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>禁止 <code>const data: any = ...</code></li>
      <li>禁止 <code>: any</code> 作为参数类型</li>
      <li>禁止 <code>as any</code> 类型断言</li>
    </ul>
  </div>
</div>

---

## 3. 命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| 组件文件 | snake_case | `meeting_analytics.tsx` |
| 组件名 | PascalCase | `MeetingAnalytics` |
| 工具函数文件 | snake_case | `get_user_info.ts` |
| 自定义 Hook | `use_*.ts` | `use_user_data.ts` |
| 变量名 | snake_case | `total_records` |
| 类型/接口 | PascalCase | `UserProfile` |

---

## 4. Import 规范

| 类型 | 规则 |
|------|------|
| ✅ 正确 | 绝对路径 `import { Button } from "@/components/ui/button"` |
| ❌ 禁止 | 相对路径层级过深 `import { Button } from "../../../../components/..."` |

---

## 5. 文件头模板

```typescript
/**
 * 文件名: {相对路径}
 * 作者: wuhao
 * 日期: {YYYY-MM-DD HH:MM:SS}
 * 描述: {该文件的功能简述，一句话概括}
 */
```

---

## 6. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止 any</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须显式声明类型</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#2E7D32;">文件头模板</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">作者: wuhao</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">绝对路径 Import</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">@/components/...</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">try/catch/finally</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">所有异步调用必须</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">snake_case</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">文件名和变量名</div>
  </div>

</div>