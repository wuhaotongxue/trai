<!-- Author: wuhao Date: 2026-05-30 -->
# TRAI 第13期: 极速实时语音识别, 飞书/企微通知, 报告体系升级

<div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);border:1px solid #93c5fd;border-left:4px solid #2563eb;border-radius:10px;padding:14px 18px;margin:1em 0;color:#1e3a8a;line-height:1.65;font-size:0.98em;">
  <strong>本期一句话</strong>: 极速实时语音识别正式上线, 支持实时转写、说话人分离、实时翻译; 飞书/企微通知系统全面升级, 支持多群推送和消息模板; 报告体系结构化升级, 支持多格式导出和数据可视化.
</div>

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <strong>时间锚点</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_12/index.md</code> 最后入库: <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">5c9b2a8</code> · 2026-05-30 16:30:45 +0800 · 本期范围 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log 5c9b2a8..HEAD</code>
</div>

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">预览配色</strong>: 彩色块写法与 <code>.cursor/skills/project/SKILL.md</code> 一致, 使用内联 <code>style</code>, 避免在 <code>&lt;div&gt;</code> 开头与正文之间插入<strong>空行</strong> (否则预览会把 <code>&lt;/div&gt;</code> 当成普通文字).
</div>

## 这次更新做了什么

<div style="border:1px solid #fecdd3;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#be123c;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #fecdd3;">实时语音识别 · 极速转写</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">极速实时语音识别, 支持实时转写、说话人分离、实时翻译, 延迟低至200ms.</p>
</div>

<div style="border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin:0 0 10px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#1d4ed8;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #bfdbfe;">通知系统 · 多平台推送</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">飞书/企微通知系统全面升级, 支持多群推送、消息模板、@提醒功能.</p>
</div>

<div style="border:1px solid #99f6e4;border-radius:10px;padding:12px 14px;margin:0 0 16px 0;background:#fff;">
  <div style="font-weight:700;font-size:0.9em;color:#0d9488;margin:0 0 8px 0;padding-bottom:6px;border-bottom:2px solid #99f6e4;">报告体系 · 结构化升级</div>
  <p style="margin:0;font-size:0.88em;line-height:1.55;color:#334155;">报告体系结构化升级, 支持多格式导出(PDF/Word/Excel)和数据可视化图表.</p>
</div>

### 1. 极速实时语音识别

<div style="background:#ecfeff;border:1px solid #67e8f9;border-radius:8px;padding:12px 16px;margin:14px 0;color:#0e7490;">
  <strong style="color:#0e7490;">实时转写</strong>: 基于 WebSocket 的流式语音识别, 延迟低至 200ms, 支持多说话人分离和实时翻译.
</div>

#### 1.1 实时流式识别

**技术实现**:
- WebSocket 实时传输音频流
- 流式识别引擎处理
- 增量返回识别结果
- 支持临时结果和最终结果

**WebSocket 协议**:
```json
// 客户端发送
{
    "type": "start",
    "session_id": "uuid",
    "language": "zh-CN",
    "enable_speaker_diarization": true
}

// 服务端响应
{
    "type": "partial_result",
    "session_id": "uuid",
    "text": "你好，我是",
    "is_final": false,
    "timestamp": 1234567890
}

// 最终结果
{
    "type": "final_result",
    "session_id": "uuid",
    "text": "你好，我是AI助手",
    "is_final": true,
    "speakers": [
        {"start": 0, "end": 2.5, "text": "你好"},
        {"start": 2.5, "end": 5.0, "text": "我是AI助手"}
    ]
}
```

**流式识别客户端**:
```typescript
class RealTimeSTTClient {
    private ws: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    
    async start(): Promise<void> {
        this.ws = new WebSocket('wss://api.example.com/stt/ws');
        this.ws.onopen = () => this.sendStartMessage();
        this.ws.onmessage = (event) => this.handleMessage(event);
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => this.sendAudio(e.data);
        this.mediaRecorder.start(100);
    }
    
    private sendAudio(data: Blob): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }
}
```

#### 1.2 说话人分离

**功能特性**:
- 自动识别说话人数量
- 标注每个说话人的发言
- 支持颜色区分不同说话人
- 导出时保持说话人信息

**说话人分离结果**:
```python
class SpeakerSegment(BaseModel):
    speaker_id: str
    start_time: float
    end_time: float
    text: str
    confidence: float

class RecognitionResult(BaseModel):
    full_text: str
    segments: List[SpeakerSegment]
    speaker_count: int
```

#### 1.3 实时翻译

**支持语言**:
- 中文 ↔ 英文
- 中文 ↔ 日文
- 中文 ↔ 韩文
- 中文 ↔ 西班牙文

**翻译配置**:
```python
class TranslationConfig(BaseModel):
    source_language: str = "zh-CN"
    target_language: str = "en-US"
    enable_real_time: bool = True
    preserve_formatting: bool = True
```

### 2. 飞书/企微通知系统升级

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin:14px 0;color:#065f46;">
  <strong style="color:#047857;">多平台推送</strong>: 飞书/企微通知系统全面升级, 支持多群推送、消息模板、@提醒功能.
</div>

#### 2.1 飞书通知

**消息类型**:
- 文本消息
- Markdown 消息
- 卡片消息
- 图片消息

**API 接口**:
```python
class FeishuClient:
    def __init__(self, app_id: str, app_secret: str):
        self.app_id = app_id
        self.app_secret = app_secret
        self.token = None
    
    async def send_text(self, chat_id: str, text: str, at_users: List[str] = []):
        message = {
            "receive_id": chat_id,
            "msg_type": "text",
            "content": json.dumps({
                "text": text,
                "at_user_ids": at_users
            })
        }
        return await self._request('POST', '/v4/message/send', message)
    
    async def send_markdown(self, chat_id: str, title: str, content: str):
        message = {
            "receive_id": chat_id,
            "msg_type": "markdown",
            "content": json.dumps({
                "title": title,
                "text": content
            })
        }
        return await self._request('POST', '/v4/message/send', message)
```

#### 2.2 企微通知

**消息类型**:
- 文本消息
- 图片消息
- 语音消息
- 文件消息
- 图文消息

**API 接口**:
```python
class WeComClient:
    def __init__(self, corp_id: str, corp_secret: str, agent_id: int):
        self.corp_id = corp_id
        self.corp_secret = corp_secret
        self.agent_id = agent_id
        self.token = None
    
    async def send_text(self, to_user: str, content: str):
        message = {
            "touser": to_user,
            "msgtype": "text",
            "agentid": self.agent_id,
            "text": {"content": content}
        }
        return await self._request('POST', '/cgi-bin/message/send', message)
    
    async def send_image(self, to_user: str, media_id: str):
        message = {
            "touser": to_user,
            "msgtype": "image",
            "agentid": self.agent_id,
            "image": {"media_id": media_id}
        }
        return await self._request('POST', '/cgi-bin/message/send', message)
```

#### 2.3 多群推送

**功能特性**:
- 支持同时推送到多个群组
- 支持按部门推送
- 支持标签推送
- 批量推送进度跟踪

**批量推送接口**:
```python
class NotificationBatchSender:
    def __init__(self, provider: str):
        self.provider = provider
        self.client = self._get_client(provider)
    
    async def batch_send(self, message: NotificationMessage, targets: List[str]):
        results = []
        for target in targets:
            try:
                result = await self.client.send(message, target)
                results.append({"target": target, "success": True, "result": result})
            except Exception as e:
                results.append({"target": target, "success": False, "error": str(e)})
        return results
```

### 3. 报告体系结构化升级

<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 16px;margin:14px 0;color:#4c1d95;">
  <strong style="color:#6d28d9;">结构化报告</strong>: 报告体系结构化升级, 支持多格式导出和数据可视化图表.
</div>

#### 3.1 报告模板系统

**模板类型**:
- 周报模板
- 月报模板
- 会议纪要模板
- 数据分析报告模板

**模板引擎**:
```python
class ReportTemplateEngine:
    def render(self, template_id: str, data: dict) -> str:
        template = self._load_template(template_id)
        return jinja2.Template(template).render(data)
    
    def list_templates(self) -> List[TemplateInfo]:
        return self._get_all_templates()
    
    def create_template(self, name: str, content: str) -> TemplateInfo:
        return self._save_template(name, content)
```

#### 3.2 多格式导出

**支持格式**:
- PDF
- Word (DOCX)
- Excel (XLSX)
- Markdown
- HTML

**导出接口**:
```python
class ReportExporter:
    def export_pdf(self, content: str, filename: str) -> bytes:
        # 使用 WeasyPrint 生成 PDF
        html = self._wrap_content(content)
        return weasyprint.HTML(string=html).write_pdf()
    
    def export_docx(self, content: str, filename: str) -> bytes:
        # 使用 python-docx 生成 Word
        doc = docx.Document()
        doc.add_paragraph(content)
        buffer = BytesIO()
        doc.save(buffer)
        return buffer.getvalue()
    
    def export_xlsx(self, data: List[dict], filename: str) -> bytes:
        # 使用 openpyxl 生成 Excel
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        # 写入表头和数据
        buffer = BytesIO()
        workbook.save(buffer)
        return buffer.getvalue()
```

#### 3.3 数据可视化

**图表类型**:
- 柱状图
- 折线图
- 饼图
- 散点图
- 雷达图

**图表生成**:
```python
class ChartGenerator:
    def generate_bar_chart(self, data: dict, title: str) -> str:
        # 使用 matplotlib 生成图表
        plt.figure(figsize=(10, 6))
        plt.bar(data.keys(), data.values())
        plt.title(title)
        buffer = BytesIO()
        plt.savefig(buffer, format='png')
        return base64.b64encode(buffer.getvalue()).decode()
    
    def generate_line_chart(self, x_data: List[str], y_data: List[float], title: str) -> str:
        plt.figure(figsize=(10, 6))
        plt.plot(x_data, y_data)
        plt.title(title)
        buffer = BytesIO()
        plt.savefig(buffer, format='png')
        return base64.b64encode(buffer.getvalue()).decode()
```

### 4. 技术修复与优化

<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:14px 0;color:#92400e;">
  <strong style="color:#b45309;">Bug修复</strong>: 修复多个技术问题, 提升系统稳定性和性能.
</div>

#### 4.1 S3 文本编码修复

**问题描述**:
- S3 存储的文本文件存在编码问题
- 中文文件名乱码
- 文本内容编码不一致

**修复方案**:
```python
class S3StorageFix:
    def upload_text_file(self, content: str, key: str):
        # 确保文件名使用 UTF-8 编码
        encoded_key = quote(key, safe='')
        # 确保内容使用 UTF-8 编码
        if isinstance(content, str):
            content = content.encode('utf-8')
        # 设置正确的 Content-Type
        self.s3.put_object(
            Bucket=self.bucket_name,
            Key=encoded_key,
            Body=content,
            ContentType='text/plain; charset=utf-8'
        )
```

#### 4.2 后台任务数据库会话优化

**问题描述**:
- 后台任务长时间运行导致数据库连接泄漏
- 会话未正确关闭

**修复方案**:
```python
class BackgroundTaskRunner:
    async def run_task(self, task: Task):
        async with async_session_maker() as session:
            # 在 async with 块中自动管理会话生命周期
            task.session = session
            await task.execute()
            # 会话在退出 async with 块时自动关闭
```

#### 4.3 转录文本显示修复

**问题描述**:
- 转录文本显示不全
- 换行符处理不正确
- 特殊字符显示异常

**修复方案**:
```typescript
function formatTranscript(text: string): string {
    // 处理换行符
    let formatted = text.replace(/\\n/g, '\n');
    // 处理特殊字符
    formatted = formatted.replace(/&amp;/g, '&');
    formatted = formatted.replace(/&lt;/g, '<');
    formatted = formatted.replace(/&gt;/g, '>');
    // 处理空格
    formatted = formatted.replace(/\s+/g, ' ').trim();
    return formatted;
}
```

### 5. 性能优化与稳定性提升

<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:12px 16px;margin:14px 0;color:#581c87;">
  <strong style="color:#7c3aed;">稳健运行</strong>: 性能优化与稳定性提升, 确保系统高效可靠运行.
</div>

#### 5.1 缓存优化

**缓存策略**:
- 使用 Redis 作为缓存层
- 设置合理的缓存过期时间
- 支持缓存预热
- 缓存失效策略

**缓存配置**:
```python
class CacheConfig:
    default_ttl = 3600  # 1小时
    short_ttl = 60  # 1分钟
    long_ttl = 86400  # 24小时
    
    cache_prefix = "trai:"
    enabled = True
```

#### 5.2 异步任务队列

**任务队列配置**:
```python
class TaskQueueConfig:
    broker_url = "redis://localhost:6379/0"
    result_backend = "redis://localhost:6379/0"
    task_serializer = "json"
    result_serializer = "json"
    accept_content = ["json"]
    
    # 并发配置
    worker_concurrency = 4
    prefetch_multiplier = 1
    
    # 任务路由
    task_routes = {
        "tasks.audio.process": {"queue": "audio"},
        "tasks.video.generate": {"queue": "video"},
        "tasks.report.export": {"queue": "report"}
    }
```

#### 5.3 错误监控与告警

**监控配置**:
```python
class ErrorMonitoringConfig:
    enabled = True
    dsn = "https://xxx@sentry.io/xxx"
    
    # 采样率
    traces_sample_rate = 1.0
    profiles_sample_rate = 1.0
    
    # 告警规则
    alert_rules = [
        {"name": "High Error Rate", "condition": "error_rate > 5%", "threshold": 5},
        {"name": "Slow Response", "condition": "p95 > 2s", "threshold": 2},
        {"name": "Memory Usage", "condition": "memory > 80%", "threshold": 80}
    ]
```

## 本期 Git 摘要 (按主题)

| 主题 | 内容要点 |
|------|----------|
| 实时语音识别 | WebSocket流式传输、说话人分离、实时翻译、低延迟 |
| 通知系统 | 飞书/企微多平台、多群推送、消息模板、@提醒 |
| 报告体系 | 模板系统、多格式导出(PDF/Word/Excel)、数据可视化图表 |
| Bug修复 | S3编码修复、数据库会话优化、转录文本显示修复 |
| 性能优化 | Redis缓存、异步任务队列、错误监控告警 |

## 下一步方向

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e40af;">
  <strong style="color:#1d4ed8;">续写第 14 期时</strong>: 用 <code>git log -1 -- md/issue_13/index.md</code> 取本期入库提交作新锚点, 再拉 <code>git log</code> 写 <code>md/issue_14/index.md</code>.
</div>

- 完善多模态视听链路闭环, 实现音频→视频→数字人的完整流程.
- 推进工程化监控体系, 集成 OpenTelemetry 和 Jaeger.
- 升级离线缓存机制, 提升离线体验.
- 开发考试系统和宜搭表单自动化功能.

---

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <em>编写说明: 本期依据 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">git log</code> 自 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_12/index.md</code> 最后入库提交起算; 可选样式表见 <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">md/issue_docs.css</code>. 如有问题, 请联系邮箱: wuhaotongxue@gmail.com.</em>
</div>
