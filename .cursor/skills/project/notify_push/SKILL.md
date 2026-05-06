---
name: "notify_push"
description: >-
  用于自动发送飞书+企业微信推送通知（推送后自动调用）。包含防乱码最佳实践，强制 UTF-8 编码，
  推送到飞书 wuhao 群、企微 wuhao 群、企微 wudu 群。
---

# 推送通知规范_(notify_push)

每次 git push 完成后必须自动调用本技能，发送飞书+企业微信通知。

## 乱码根因与解决方案

PowerShell 的 ConvertTo-Json -Compress 默认输出字符串，但直接传给 -Body 时会被编码为系统默认编码（通常是 GB2312），导致飞书/企微收到乱码。

**强制要求**：始终使用 [System.Text.Encoding]::UTF8.GetBytes($jsonString) 将 JSON 字符串转换为 UTF-8 字节数组，再传给 -Body。

## 通知目标

| 平台 | 群名 | 环境变量 |
|------|------|---------|
| 飞书 | wuhao 群 | $env:NOTIFY_FEISHU_WEBHOOK |
| 企业微信 | wuhao 群 | $env:NOTIFY_WECOM_WUHAO_WEBHOOK |
| 企业微信 | wudu 群 | $env:NOTIFY_WECOM_WUDU_WEBHOOK |

Webhook URL 配置在 backend/.env 第 3479-3524 行（使用 Select-String 搜索，不要只用 Grep）。

## 飞书卡片通知（PowerShell）

```powershell
$feishuUrl = $env:NOTIFY_FEISHU_WEBHOOK
$commitMsg = "文档 更新 git_submit 通知格式"
$roleName = "爆炸分身"
$roleComment = "呜呜本来只想推送的，结果发现漏了通知，补发补发！"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$feishuBody = @{
    msg_type = "interactive"
    card = @{
        config = @{ wide_screen_mode = $true }
        header = @{
            title = @{ tag = "plain_text"; content = "🚀 TRAI 代码推送通知" }
            template = "blue"
        }
        elements = @(
            @{ tag = "markdown"; content = "**推送人**: wuhao | **Commit**: $($commitMsg)" }
            @{ tag = "markdown"; content = "**角色**: $($roleName) | $($roleComment)" }
            @{ tag = "markdown"; content = "**变更详情**:
- backend/README.md: 更新文档" }
            @{ tag = "markdown"; content = "**变更**: 1 个文件 (+3 -0)
**时间**: $($timestamp)" }
        )
    }
} | ConvertTo-Json -Depth 10 -Compress

if ($feishuUrl) {
    try {
        # 强制 UTF-8 编码，防止中文乱码
        $feishuBytes = [System.Text.Encoding]::UTF8.GetBytes($feishuBody)
        Invoke-WebRequest -Uri $feishuUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $feishuBytes -TimeoutSec 15
        Write-Host "Feishu OK!"
    } catch {
        Write-Host "Feishu failed: $($_.Exception.Message)"
    }
}
```

## 企业微信 Markdown 通知（PowerShell - 同时推 wuhao 和 wudu 两个群）

```powershell
$wecomWuhaoUrl = $env:NOTIFY_WECOM_WUHAO_WEBHOOK
$wecomWuduUrl = $env:NOTIFY_WECOM_WUDU_WEBHOOK
$commitMsg = "文档 更新 git_submit 通知格式"
$roleName = "爆炸分身"
$roleComment = "呜呜本来只想推送的，结果发现漏了通知，补发补发！"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$wecomPayload = @{
    msgtype = "markdown"
    markdown = @{
        content = "**🚀 TRAI 代码推送通知**

**推送人**: wuhao | **Commit**: $($commitMsg)

**角色**: $($roleName) | $($roleComment)

**变更详情**:
- backend/README.md: 更新文档

**变更**: 1 个文件 (+3 -0)

**时间**: $($timestamp)"
    }
}
$wecomBody = $wecomPayload | ConvertTo-Json -Depth 10 -Compress

# 推送到 wuhao 群
if ($wecomWuhaoUrl) {
    try {
        $wecomBytes = [System.Text.Encoding]::UTF8.GetBytes($wecomBody)
        Invoke-WebRequest -Uri $wecomWuhaoUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $wecomBytes -TimeoutSec 15
        Write-Host "WeCom wuhao OK!"
    } catch {
        Write-Host "WeCom wuhao failed: $($_.Exception.Message)"
    }
}

# 推送到 wudu 群
if ($wecomWuduUrl) {
    try {
        $wecomBytes = [System.Text.Encoding]::UTF8.GetBytes($wecomBody)
        Invoke-WebRequest -Uri $wecomWuduUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $wecomBytes -TimeoutSec 15
        Write-Host "WeCom wudu OK!"
    } catch {
        Write-Host "WeCom wudu failed: $($_.Exception.Message)"
    }
}
```

## 关键防乱码要点

1. 必须：[System.Text.Encoding]::UTF8.GetBytes($jsonString) 强制转换
2. 必须：-ContentType "application/json; charset=utf-8"
3. 禁止：直接将 ConvertTo-Json 结果传给 -Body
4. 禁止：使用 [System.Text.Encoding]::Default 或 GB2312 编码
5. 禁止：在 JSON 字符串中混用中文引号、中文括号等非 ASCII 字符
