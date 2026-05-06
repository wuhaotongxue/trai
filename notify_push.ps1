# 补发飞书+企业微信推送通知
$feishuUrl = $env:NOTIFY_FEISHU_WEBHOOK
$wecomWuhaoUrl = $env:NOTIFY_WECOM_WUHAO_WEBHOOK
$wecomWuduUrl = $env:NOTIFY_WECOM_WUDU_WEBHOOK

if (-not $feishuUrl) { Write-Error "NOTIFY_FEISHU_WEBHOOK not set"; exit 1 }
if (-not $wecomWuhaoUrl) { Write-Error "NOTIFY_WECOM_WUHAO_WEBHOOK not set"; exit 1 }
if (-not $wecomWuduUrl) { Write-Error "NOTIFY_WECOM_WUDU_WEBHOOK not set"; exit 1 }

$commitMsg = "chore: update README"
$roleName = "爆炸分身"
$roleComment = "补发通知"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$feishuBody = @{
    msg_type = "interactive"
    card = @{
        config = @{ wide_screen_mode = $true }
        header = @{ title = @{ tag = "plain_text"; content = "TRAI 推送" }; template = "blue" }
        elements = @(
            @{ tag = "markdown"; content = "**推送人**: wuhao | **Commit**: $($commitMsg)" }
            @{ tag = "markdown"; content = "**角色**: $($roleName) | $($roleComment)" }
            @{ tag = "markdown"; content = "**时间**: $($timestamp)" }
        )
    }
} | ConvertTo-Json -Depth 10 -Compress

Invoke-WebRequest -Uri $feishuUrl -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($feishuBody)) -TimeoutSec 15
Invoke-WebRequest -Uri $wecomWuhaoUrl -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($feishuBody)) -TimeoutSec 15
Invoke-WebRequest -Uri $wecomWuduUrl -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($feishuBody)) -TimeoutSec 15
