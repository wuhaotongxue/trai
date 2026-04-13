---
name: "readme-update"
description: >-
  自动更新 README 的 Changelog 条目。用户要求更新日志/写 README 或提交前需要补齐 README 时调用。
---

# 自动更新_README_的_Changelog（readme_update）

当调用此技能时，请严格按照以下步骤执行：

## 执行步骤

### 1. 确认本次变更模块与范围

<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:12px 0;">
  <div style="background:#F5F5F5;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;font-size:13px;">backend/</div>
  <div style="background:#F5F5F5;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;font-size:13px;">frontend_next/</div>
  <div style="background:#F5F5F5;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;font-size:13px;">desktop_client/</div>
  <div style="background:#F5F5F5;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;font-size:13px;">electron/</div>
</div>

### 2. 生成真实时间戳标题

<div style="background:#FFF9C4;border:1px solid #FFF176;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#F57F17;">&#x26A0; 必须使用系统当前时间</strong>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    标题格式：<code>模块_YYYY_MM_DD_HHmm</code>，例如：<code>后端_2026_04_08_1430</code> 或 <code>前端_2026_04_08_1430</code>
  </div>
</div>

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 严禁使用综合标签</strong>
  <ul style="margin:8px 0 0 0;padding-left:20px;font-size:13px;color:#555;">
    <li>当一次提交包含多个模块修改时，<strong>必须按模块拆分标题</strong>。</li>
    <li>禁止写 <code>综合_2026_04...</code>。</li>
    <li>正确做法是分块编写：<code>### 前端_时间</code>、<code>### 后端_时间</code>、<code>### 客户端_时间</code> 等。</li>
  </ul>
</div>

### 3. 归纳本次变更的要点

- 使用中文，短句，动词+对象
- 例如：`重构(domain)`、`修复(webrtc)`

### 4. 将条目追加到两处 README 顶部（保持倒序）

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E3F2FD;border:1px solid #90CAF9;border-radius:8px;padding:12px;">
    <strong style="color:#1565C0;">局部 README</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      如 <code>backend/README.md</code>
    </div>
  </div>
  <div style="background:#E3F2FD;border:1px solid #90CAF9;border-radius:8px;padding:12px;">
    <strong style="color:#1565C0;">根 README</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      如 <code>README.md</code>
    </div>
  </div>
</div>

### 5. 校验并保存

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 正确做法</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>两处 README 顶部都出现相同时间戳标题与摘要</li>
      <li>不得覆盖已有条目，只能追加</li>
      <li>仅在 "## 📝 更新日志 (Changelog)" 段落顶部追加</li>
    </ul>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 错误做法</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>在其他章节插入</li>
      <li>创建重复的 Changelog 段落</li>
    </ul>
  </div>
</div>

---

## 示例条目

```
### 🛠️ 后端_2026_04_08_1430
- **新增(release)**: 添加 Electron 桌面客户端发布管理接口 (S3 上传/latest.yml 生成)
- **重构(skills)**: 重构 skills 目录结构，按 backend/desktop_client/electron/project 分域管理
```

---

## 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">两处 README</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">局部+根目录</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">时间戳格式</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">模块_YYYY_MM_DD_HHmm</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">追加位置</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">Changelog 段落顶部</div>
  </div>

</div>
