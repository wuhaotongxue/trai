# 补发飞书+企业微信推送通知
# 通知配置统一从环境变量读取（与 backend/.env 保持一致）
$feishuUrl = $env:NOTIFY_FEISHU_WEBHOOK
$wecomWuhaoUrl = $env:NOTIFY_WECOM_WUHAO_WEBHOOK
$wecomWuduUrl = $env:NOTIFY_WECOM_WUDU_WEBHOOK
$commitMsg = "feat(subtitle): 视频转音频增加 SRT 字幕提取功能"
$roleName = "地理专家"
$roleComment = "说到经纬度呀～这次的字幕提取功能已经精准定位，像卫星一样成功推送到群聊啦！"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 检查配置是否完整
if (-not $feishuUrl -and -not $wecomWuhaoUrl -and -not $wecomWuduUrl) {
    Write-Host "[WARN] 未配置任何通知环境变量，跳过通知发送"
    Write-Host "请确保 backend/.env 中已配置以下变量："
    Write-Host "  - NOTIFY_FEISHU_WEBHOOK"
    Write-Host "  - NOTIFY_WECOM_WUHAO_WEBHOOK"
    Write-Host "  - NOTIFY_WECOM_WUDU_WEBHOOK"
    exit 0
}

# UTF-8 编码辅助函数（防乱码）
function Get-Utf8Bytes($text) {
    return [System.Text.Encoding]::UTF8.GetBytes($text)
}

# 发送飞书卡片
if ($feishuUrl) {
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
- 🎬 后端 video_to_audio 接口使用 FunASR 本地模型自动提取字幕
- 🌐 前端 to_audio 任务增加提取字幕 (SRT) 下载按钮
- � 修复 delete_subtitle 接口中 object_prefix 未定义的问题" }
                @{ tag = "markdown"; content = "**变更**: 11 个文件 (+539 -4693)
**时间**: $($timestamp)" }
            )
        }
    }
    $feishuJson = $feishuBody | ConvertTo-Json -Depth 10 -Compress

    Write-Host "Sending Feishu notification..."
    try {
        Invoke-WebRequest -Uri $feishuUrl -Method Post -ContentType "application/json; charset=utf-8" -Body (Get-Utf8Bytes $feishuJson) -TimeoutSec 15
        Write-Host "Feishu OK!"
    } catch {
        Write-Host "Feishu failed: $($_.Exception.Message)"
    }
}

# 发送企业微信 Markdown（wuhao 群）
if ($wecomWuhaoUrl) {
    $wecomPayload = @{
        msgtype = "markdown"
        markdown = @{
            content = "**🚀 TRAI 代码推送通知**

**推送人**: wuhao | **Commit**: $($commitMsg)

**角色**: $($roleName) | $($roleComment)

**变更详情**:
- 🎬 后端 video_to_audio 接口使用 FunASR 本地模型自动提取字幕
- 🌐 前端 to_audio 任务增加提取字幕 (SRT) 下载按钮
- � 修复 delete_subtitle 接口中 object_prefix 未定义的问题

**变更**: 11 个文件 (+539 -4693)

**时间**: $($timestamp)"
        }
    }
    $wecomJson = $wecomPayload | ConvertTo-Json -Depth 10 -Compress

    Write-Host "Sending WeCom wuhao notification..."
    try {
        Invoke-WebRequest -Uri $wecomWuhaoUrl -Method Post -ContentType "application/json; charset=utf-8" -Body (Get-Utf8Bytes $wecomJson) -TimeoutSec 15
        Write-Host "WeCom wuhao OK!"
    } catch {
        Write-Host "WeCom wuhao failed: $($_.Exception.Message)"
    }
}

# 发送企业微信 Markdown（wudu 群）
if ($wecomWuduUrl) {
    Write-Host "Sending WeCom wudu notification..."
    try {
        Invoke-WebRequest -Uri $wecomWuduUrl -Method Post -ContentType "application/json; charset=utf-8" -Body (Get-Utf8Bytes $wecomJson) -TimeoutSec 15
        Write-Host "WeCom wudu OK!"
    } catch {
        Write-Host "WeCom wudu failed: $($_.Exception.Message)"
    }
}