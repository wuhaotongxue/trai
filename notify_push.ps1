# TRAI 代码推送通知脚本
$feishuUrl = $env:NOTIFY_FEISHU_WEBHOOK
$wecomWuhaoUrl = $env:NOTIFY_WECOM_WUHAO_WEBHOOK
$wecomWuduUrl = $env:NOTIFY_WECOM_WUDU_WEBHOOK

if (-not $feishuUrl) { Write-Error "NOTIFY_FEISHU_WEBHOOK not set"; exit 1 }
if (-not $wecomWuhaoUrl) { Write-Error "NOTIFY_WECOM_WUHAO_WEBHOOK not set"; exit 1 }
if (-not $wecomWuduUrl) { Write-Error "NOTIFY_WECOM_WUDU_WEBHOOK not set"; exit 1 }

$commitMsg = "chore: 修复 notify_push.ps1 明文配置问题"
$roleName = "爆炸分身"
$roleComment = "已完成代码推送，同步更新三个分支"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 飞书卡片通知
$feishuBody = @{
    msg_type = "interactive"
    card = @{
        config = @{ wide_screen_mode = $true }
        header = @{ title = @{ tag = "plain_text"; content = "🚀 TRAI 代码推送通知" }; template = "blue" }
        elements = @(
            @{ tag = "markdown"; content = "**推送人**: wuhao | **Commit**: $($commitMsg)" }
            @{ tag = "markdown"; content = "**角色**: $($roleName) | $($roleComment)" }
            @{ tag = "markdown"; content = "**推送分支**: main / wuhao / develop" }
            @{ tag = "markdown"; content = "**时间**: $($timestamp)" }
        )
    }
} | ConvertTo-Json -Depth 10 -Compress

# 企业微信 markdown 通知
$wecomPayload = @{
    msgtype = "markdown"
    markdown = @{
        content = "**🚀 TRAI 代码推送通知**

**推送人**: wuhao | **Commit**: $($commitMsg)

**角色**: $($roleName) | $($roleComment)

**推送分支**: main / wuhao / develop

**时间**: $($timestamp)"
    }
}
$wecomBody = $wecomPayload | ConvertTo-Json -Depth 10 -Compress

# 发送飞书通知
try {
    $feishuBytes = [System.Text.Encoding]::UTF8.GetBytes($feishuBody)
    Invoke-WebRequest -Uri $feishuUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $feishuBytes -TimeoutSec 15
    Write-Host "✅ Feishu notification sent!"
} catch {
    Write-Host "❌ Feishu failed: $($_.Exception.Message)"
}

# 发送企业微信 wuhao 群
try {
    $wecomBytes = [System.Text.Encoding]::UTF8.GetBytes($wecomBody)
    Invoke-WebRequest -Uri $wecomWuhaoUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $wecomBytes -TimeoutSec 15
    Write-Host "✅ WeCom wuhao notification sent!"
} catch {
    Write-Host "❌ WeCom wuhao failed: $($_.Exception.Message)"
}

# 发送企业微信 wudu 群
try {
    $wecomBytes = [System.Text.Encoding]::UTF8.GetBytes($wecomBody)
    Invoke-WebRequest -Uri $wecomWuduUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $wecomBytes -TimeoutSec 15
    Write-Host "✅ WeCom wudu notification sent!"
} catch {
    Write-Host "❌ WeCom wudu failed: $($_.Exception.Message)"
}