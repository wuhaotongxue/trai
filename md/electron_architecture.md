# Electron 整体代码架构文档

<div style="background:#eff6ff;border:1px solid #93c5fd;border-left:4px solid #2563eb;border-radius:10px;padding:14px 18px;margin:1em 0;color:#1e3a5f;line-height:1.65;font-size:0.98em;">
  <strong>本文档说明</strong>：本文档定义 TRAI 项目 Electron 桌面客户端的整体代码架构，包括目录结构、五层架构、IPC 通道、窗口管理、自动更新与 S3 上传、渲染进程安全等核心设计。适用于 Windows/macOS/Linux 跨平台桌面应用开发。
</div>

## 1. 技术选型

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Node.js | 20 LTS | 稳定长期支持版本 |
| Electron | 33.x | 最新稳定版，支持 ESM，更好的性能 |
| TypeScript | 5.x | 严格模式，禁止 any |
| React | 18.x | 渲染进程 UI 框架 |
| Vite | 6.x | 渲染进程高速构建工具 |
| electron-builder | 25.x | 应用打包与分发 |
| electron-updater | 6.x | 增量更新，支持 S3/GitHub |
| 包管理器 | pnpm | 高性能依赖管理 |

## 2. 目录结构

```
electron/
├── package.json                 # 项目配置，依赖声明，npm scripts
├── tsconfig.json                # TypeScript 根配置
├── tsconfig.main.json           # 主进程配置，target: node20
├── tsconfig.renderer.json       # 渲染进程配置，target: esnext
├── tsconfig.preload.json       # 预加载脚本配置
├── vite.config.ts              # Vite 构建配置（渲染进程）
├── electron-builder.yml         # electron-builder 打包配置
├── .env.example                # 环境变量模板
├── src/
│   ├── main/                   # 主进程 (Node.js，Electron 核心)
│   │   ├── index.ts            # 主进程入口，app.whenReady()
│   │   ├── window-manager.ts   # 窗口管理器，多窗口生命周期
│   │   ├── auto-updater.ts     # 自动更新模块，检测/下载/安装
│   │   ├── menu.ts             # 应用菜单定义
│   │   ├── ipc/                # IPC 处理层（主进程接收）
│   │   │   ├── index.ts        # IPC 通道注册入口
│   │   │   ├── channels.ts     # 通道常量定义，所有通道汇总
│   │   │   └── handlers/       # 各通道处理器（一个文件一个领域）
│   │   │       ├── auth.handler.ts      # 认证相关
│   │   │       ├── chat.handler.ts      # 聊天相关
│   │   │       ├── session.handler.ts   # 会话相关
│   │   │       ├── file.handler.ts      # 文件上传下载
│   │   │       ├── app.handler.ts       # 应用控制（最小化/最大化）
│   │   │       └── update.handler.ts    # 更新相关
│   │   ├── services/            # 业务服务层（主进程业务逻辑）
│   │   │   ├── auth.service.ts         # 认证业务（登录/登出/刷新令牌）
│   │   │   ├── chat.service.ts         # 聊天业务（消息发送/历史记录）
│   │   │   ├── session.service.ts      # 会话业务（创建/列表/删除）
│   │   │   ├── upload.service.ts       # 文件上传业务
│   │   │   ├── s3-upload.service.ts   # S3 上传业务
│   │   │   └── update.service.ts       # 更新检查/下载业务
│   │   ├── platform/            # 平台层（Node.js 原生 API 封装）
│   │   │   ├── file-system.ts   # 文件读写，路径处理，临时文件
│   │   │   ├── clipboard.ts     # 剪贴板读写
│   │   │   ├── notification.ts # 系统通知（Electron Notification）
│   │   │   ├── shell.ts         # shell.openExternal 等
│   │   │   ├── power-monitor.ts # 电源监控，防止系统休眠
│   │   │   └── network-status.ts # 网络状态检测
│   │   └── utils/              # 主进程工具函数
│   │       ├── logger.ts        # electron-log 配置
│   │       ├── config.ts        # 环境变量读取
│   │       └── cache.ts         # 缓存管理
│   ├── preload/                 # 预加载脚本（安全桥接层，Renderer 可见)
│   │   ├── index.ts             # 预加载入口，window 对象注入
│   │   └── expose/              # API 暴露（按领域拆分）
│   │       ├── index.ts         # 统一导出所有 expose
│   │       ├── auth.api.ts      # 暴露 window.auth
│   │       ├── chat.api.ts      # 暴露 window.chat
│   │       ├── session.api.ts    # 暴露 window.session
│   │       ├── file.api.ts      # 暴露 window.file
│   │       ├── app.api.ts       # 暴露 window.app
│   │       └── update.api.ts    # 暴露 window.update
│   ├── renderer/                 # 渲染进程（React SPA）
│   │   ├── index.html           # HTML 模板
│   │   ├── main.tsx             # React 入口
│   │   ├── App.tsx              # 根组件
│   │   ├── app/                 # App Router 页面
│   │   │   ├── layout.tsx       # 根布局
│   │   │   ├── login/page.tsx   # 登录页
│   │   │   ├── chat/page.tsx    # 聊天主页
│   │   │   └── settings/page.tsx # 设置页
│   │   ├── components/           # React 组件
│   │   │   ├── ui/              # 基础 UI 组件（Button/Input/Card）
│   │   │   ├── chat/            # 聊天相关组件
│   │   │   │   ├── chat-panel.tsx    # 聊天主面板
│   │   │   │   ├── message-list.tsx   # 消息列表
│   │   │   │   ├── message-item.tsx    # 单条消息
│   │   │   │   ├── tool-card.tsx      # 工具调用卡片
│   │   │   │   └── token-stats.tsx    # Token 统计
│   │   │   ├── auth/            # 认证相关组件
│   │   │   └── layout/          # 布局组件（侧栏/Header）
│   │   ├── hooks/               # 自定义 React Hooks
│   │   │   ├── use-auth.ts      # 认证状态 Hook
│   │   │   ├── use-chat.ts      # 聊天 Hook（消息收发）
│   │   │   └── use-update.ts    # 更新检测 Hook
│   │   ├── stores/              # Zustand 全局状态
│   │   │   ├── auth.store.ts    # 认证状态（token/user）
│   │   │   ├── chat.store.ts    # 聊天状态（messages/sessions）
│   │   │   └── update.store.ts  # 更新状态
│   │   └── lib/                 # 工具库
│   │       ├── api-client.ts    # 统一请求封装（带 token 自动注入）
│   │       ├── utils.ts         # 通用工具函数
│   │       └── constants.ts     # 前端常量
│   └── shared/                  # 共享代码（主/预/渲染进程共用）
│       ├── types/               # 共享类型定义
│       │   ├── auth.types.ts    # 认证类型（LoginRequest 等）
│       │   ├── chat.types.ts     # 聊天类型（Message/ChatResponse 等）
│       │   ├── session.types.ts  # 会话类型
│       │   └── update.types.ts   # 更新类型
│       └── constants.ts          # 共享常量（API_BASE_URL 等）
├── resources/                   # 应用资源
│   ├── icon.ico                # Windows 应用图标
│   ├── icon.icns               # macOS 应用图标
│   └── tray.png                # 托盘图标
└── build/                      # 构建输出（.gitignore 忽略）
    └── unpacked/               # 未打包的开发构建
```

## 3. 五层架构

<div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 16px;margin:14px 0;color:#4c1d95;">
  <strong>强制分层原则</strong>：每一层只能依赖下层，禁止跨层直接调用。UI 层禁止写业务逻辑，Platform 层禁止写业务判断逻辑。
</div>

### 3.1 UI Layer（渲染进程）

**目录**: `src/renderer/`

**职责**:
- React 组件渲染，用户交互，状态展示
- Zustand 状态管理
- 页面路由（React Router）

**禁止行为**:
- 禁止直接调用 Node.js API（无 nodeIntegration）
- 禁止写业务逻辑判断（if/switch 纯展示）
- 禁止直接操作文件系统（无 fs 权限）
- 禁止直接发起网络请求（统一通过 preload API）
- 禁止使用 electron 内部模块

**文件规范**:
- 文件名: kebab-case (`chat-panel.tsx`)
- 组件名: PascalCase (`ChatPanel`)
- Props 接口: PascalCase + Props (`ChatPanelProps`)

**示例**:

```typescript
// src/renderer/components/chat/chat-panel.tsx
interface ChatPanelProps {
  sessionId: string;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const { messages, sendMessage, isStreaming } = useChatStore();

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <InputArea onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
```

### 3.2 Controller Layer（预加载脚本）

**目录**: `src/preload/`

**职责**:
- 桥接 Renderer 与 Main，安全上下文隔离
- 通过 `contextBridge.exposeInMainWorld` 暴露白名单 API
- 将 IPC invoke 封装为 Promise 返回

**禁止行为**:
- 禁止写任何业务逻辑
- 禁止直接操作数据库
- 禁止暴露 fs / net / electron 等危险 API
- 禁止直接返回原始 IPC 对象

**暴露规范**:

```typescript
// src/preload/expose/auth.api.ts
export function exposeAuthAPI() {
  contextBridge.exposeInMainWorld('auth', {
    login: (data: { username: string; password: string }) =>
      ipcRenderer.invoke('auth:login', data),
    logout: () => ipcRenderer.invoke('auth:logout'),
    refresh: () => ipcRenderer.invoke('auth:refresh'),
    me: () => ipcRenderer.invoke('auth:me'),
  });
}
```

```typescript
// src/preload/expose/chat.api.ts
export function exposeChatAPI() {
  contextBridge.exposeInMainWorld('chat', {
    send: (sessionId: string, content: string) =>
      ipcRenderer.invoke('chat:send', sessionId, content),
    stream: (sessionId: string, content: string) =>
      ipcRenderer.invoke('chat:stream', sessionId, content),
    abort: (sessionId: string) =>
      ipcRenderer.invoke('chat:abort', sessionId),
    getHistory: (sessionId: string) =>
      ipcRenderer.invoke('chat:history', sessionId),
  });
}
```

### 3.3 Service Layer（主进程业务服务）

**目录**: `src/main/services/`

**职责**:
- 业务流程编排
- 调用 Backend API（HTTP / SSE）
- 维护客户端本地状态（会话缓存等）
- 处理业务异常，返回统一格式

**禁止行为**:
- 禁止直接操作 DOM（无 BrowserWindow 引用在 Service 层）
- 禁止写 UI 渲染逻辑
- 禁止硬编码 Backend URL（从环境变量读取）

**示例**:

```typescript
// src/main/services/chat.service.ts
export class ChatService {
  private _authService: AuthService;

  constructor() {
    this._authService = new AuthService();
  }

  async sendMessage(sessionId: string, content: string): Promise<ChatResponse> {
    const user = await this._authService.getCurrentUser();
    const apiClient = new ApiClient();

    const response = await apiClient.post('/api/sessions/send', {
      sessionId,
      content,
      userId: user.id,
    });

    return response.data as ChatResponse;
  }

  async *streamMessage(
    sessionId: string,
    content: string,
    onToken: (token: string) => void,
  ): AsyncGenerator<void> {
    const apiClient = new ApiClient();
    const user = await this._authService.getCurrentUser();

    const stream = await apiClient.stream('/api/sessions/stream', {
      sessionId,
      content,
    });

    for await (const chunk of stream) {
      onToken(chunk);
      yield;
    }
  }
}
```

### 3.4 IPC Layer（主进程通信处理）

**目录**: `src/main/ipc/`

**职责**:
- IPC 通道注册（`ipcMain.handle`）
- 请求路由（分发到对应 Service）
- 参数校验（输入安全第一道关卡）
- 统一错误捕获

**禁止行为**:
- 禁止写 UI 逻辑
- 禁止写业务判断逻辑（委托给 Service 层）
- 禁止直接在 handler 中返回大对象（委托给 Service）

**通道命名规范**: `{domain}:{action}`

| 通道 | 方向 | 参数 | 返回 |
|------|------|------|------|
| `auth:login` | 渲染→主 | `{username, password}` | `User + Token` |
| `auth:logout` | 渲染→主 | 无 | `{success}` |
| `auth:refresh` | 渲染→主 | 无 | `Token` |
| `auth:me` | 渲染→主 | 无 | `User` |
| `chat:send` | 渲染→主 | `{sessionId, content}` | `ChatResponse` |
| `chat:stream` | 渲染→主 | `{sessionId, content}` | `void`（通过 SSE） |
| `chat:abort` | 渲染→主 | `{sessionId}` | `{success}` |
| `chat:history` | 渲染→主 | `{sessionId}` | `Message[]` |
| `session:create` | 渲染→主 | `{title?, model?}` | `Session` |
| `session:list` | 渲染→主 | `{limit?, offset?}` | `Session[]` |
| `session:delete` | 渲染→主 | `{sessionId}` | `{success}` |
| `file:upload` | 渲染→主 | `{filePath, type}` | `UploadResult` |
| `file:download` | 渲染→主 | `{url, filePath}` | `{success}` |
| `app:minimize` | 渲染→主 | 无 | void |
| `app:maximize` | 渲染→主 | 无 | void |
| `app:close` | 渲染→主 | 无 | void |
| `update:check` | 渲染→主 | 无 | `UpdateInfo` |
| `update:download` | 渲染→主 | 无 | `void` |
| `update:install` | 渲染→主 | 无 | void |

**Handler 示例**:

```typescript
// src/main/ipc/handlers/chat.handler.ts
import { ChatService } from '../../services/chat.service';
import { logger } from '../../utils/logger';

const chatService = new ChatService();

export function registerChatHandlers(): void {
  ipcMain.handle('chat:send', async (_event, sessionId: string, content: string) => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid sessionId');
    }
    if (!content || typeof content !== 'string' || content.length > 32000) {
      throw new Error('Invalid content');
    }

    try {
      const result = await chatService.sendMessage(sessionId, content);
      return result;
    } catch (error) {
      logger.error('[ChatHandler] send failed', error);
      throw error;
    }
  });

  ipcMain.handle('chat:abort', async (_event, sessionId: string) => {
    chatService.abortStream(sessionId);
    return { success: true };
  });
}
```

### 3.5 Platform Layer（Node.js 原生 API 封装）

**目录**: `src/main/platform/`

**职责**:
- Node.js 原生 API 封装（fs / clipboard / notification / shell）
- 系统级操作
- 纯函数为主，无状态

**禁止行为**:
- 禁止写业务判断逻辑（if role === 'admin' 等）
- 禁止直接调用 Backend API

**示例**:

```typescript
// src/main/platform/file-system.ts
import fs from 'fs/promises';
import path from 'path';

export class FileSystemPlatform {
  static async readFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  static async writeFile(filePath: string, data: Buffer): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);
  }

  static async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  static async getTempFilePath(prefix: string, ext: string): Promise<string> {
    const tmpDir = path.join(process.env.TEMP || '/tmp', 'trai');
    await this.ensureDir(tmpDir);
    return path.join(tmpDir, `${prefix}-${Date.now()}.${ext}`);
  }
}
```

## 4. 窗口管理

### 4.1 窗口类型

| 类型 | 说明 | 尺寸 | 特性 |
|------|------|------|------|
| MainWindow | 主聊天窗口 | 900x700 默认，min 600x400 | 可调整大小，记忆上次位置 |
| SettingsWindow | 设置窗口 | 650x550 固定 | modal 子窗口 |
| AboutWindow | 关于窗口 | 420x320 固定 | modal 子窗口 |
| TrayMenu | 托盘菜单 | N/A | 系统托盘图标 |

### 4.2 窗口管理器

```typescript
// src/main/window-manager.ts
export class WindowManager {
  private _mainWindow: BrowserWindow | null = null;
  private _settingsWindow: BrowserWindow | null = null;
  private _aboutWindow: BrowserWindow | null = null;

  createMainWindow(): BrowserWindow {
    const lastBounds = this._loadWindowBounds('main');

    this._mainWindow = new BrowserWindow({
      ...lastBounds,
      minWidth: 600,
      minHeight: 400,
      frame: true,
      show: false,
      backgroundColor: '#080818',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });

    this._mainWindow.on('ready-to-show', () => {
      this._mainWindow?.show();
    });

    this._mainWindow.on('close', () => {
      this._saveWindowBounds('main', this._mainWindow!.getBounds());
    });

    return this._mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this._mainWindow;
  }

  openSettings(): void {
    if (this._settingsWindow && !this._settingsWindow.isDestroyed()) {
      this._settingsWindow.focus();
      return;
    }
    this._settingsWindow = new BrowserWindow({
      width: 650,
      height: 550,
      parent: this._mainWindow!,
      modal: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    this._settingsWindow.loadURL(`${BASE_URL}/settings`);
  }

  openAbout(): void {
    if (this._aboutWindow && !this._aboutWindow.isDestroyed()) {
      this._aboutWindow.focus();
      return;
    }
    this._aboutWindow = new BrowserWindow({
      width: 420,
      height: 320,
      parent: this._mainWindow!,
      modal: true,
      resizable: false,
      frame: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    this._aboutWindow.loadURL(`${BASE_URL}/about`);
  }

  minimize(): void {
    this._mainWindow?.minimize();
  }

  maximizeOrRestore(): void {
    if (this._mainWindow?.isMaximized()) {
      this._mainWindow.restore();
    } else {
      this._mainWindow?.maximize();
    }
  }

  close(): void {
    this._mainWindow?.close();
  }
}
```

### 4.3 多显示器支持

```typescript
// 支持多显示器，自动在当前显示器打开
const cursorPoint = screen.getCursorScreenPoint();
const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);

const win = new BrowserWindow({
  x: currentDisplay.bounds.x + Math.round((currentDisplay.bounds.width - 900) / 2),
  y: currentDisplay.bounds.y + Math.round((currentDisplay.bounds.height - 700) / 2),
  width: 900,
  height: 700,
});
```

## 5. 渲染进程安全配置

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:14px 0;color:#881337;">
  <strong style="color:#C62828;">安全红线</strong>：以下配置项必须严格遵守，违者直接拒绝合并
</div>

| 配置项 | 必须值 | 危险后果 |
|--------|--------|----------|
| `contextIsolation` | `true` | 渲染进程可访问 Node.js 上下文 |
| `nodeIntegration` | `false` | 渲染进程可 require() 任意模块 |
| `sandbox` | `true` | 渲染进程可访问系统底层 API |
| `webSecurity` | `true` | 渲染进程可绕过 CSP 加载恶意脚本 |
| `allowRunningInsecureContent` | `false` | HTTPS 页面加载 HTTP 资源 |

## 6. 自动更新与 S3 上传

<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 16px;margin:14px 0;color:#1e3a5f;">
  <strong>更新策略</strong>：Electron 应用使用 electron-updater 增量更新，支持 S3 / GitHub Releases / 私有服务器三种后端。每次发布生成 `latest.yml` 元数据文件，包含版本号、下载链接、校验和等信息。
</div>

### 6.1 更新流程

```
┌──────────────────────────────────────────────────────────────────┐
│                        更新流程图                                  │
│                                                                  │
│  启动检查 → 有更新 → 下载中 → 下载完成 → 用户确认 → 安装重启        │
│     ↓           ↓           ↓           ↓           ↓           │
│  静默跳过   通知弹窗    进度条显示    保存到磁盘   自动重启        │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 更新服务

```typescript
// src/main/services/update.service.ts
export class UpdateService {
  private _updater: AutoUpdater;
  private _isDownloading: boolean = false;
  private _downloadProgress: number = 0;

  constructor() {
    this._updater = new AutoUpdater({
      provider: 's3',
      bucket: process.env.S3_BUCKET!,
      region: process.env.AWS_REGION!,
      path: 'electron',
    });

    this._updater.on('checking-for-update', () => {
      logger.info('[UpdateService] checking for update...');
      this._sendToRenderer('update:checking');
    });

    this._updater.on('update-available', (info: UpdateInfo) => {
      logger.info('[UpdateService] update available:', info.version);
      this._sendToRenderer('update:available', info);
    });

    this._updater.on('update-not-available', () => {
      logger.info('[UpdateService] no update available');
      this._sendToRenderer('update:not-available');
    });

    this._updater.on('download-progress', (progress: ProgressInfo) => {
      this._downloadProgress = progress.percent;
      this._sendToRenderer('update:progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    this._updater.on('update-downloaded', (info: UpdateInfo) => {
      logger.info('[UpdateService] update downloaded:', info.version);
      this._isDownloading = false;
      this._sendToRenderer('update:downloaded', info);
    });

    this._updater.on('error', (error: Error) => {
      logger.error('[UpdateService] update error:', error);
      this._sendToRenderer('update:error', { message: error.message });
    });
  }

  async checkForUpdate(): Promise<void> {
    try {
      await this._updater.checkForUpdates();
    } catch (error) {
      logger.error('[UpdateService] check failed:', error);
      throw error;
    }
  }

  async downloadUpdate(): Promise<void> {
    if (this._isDownloading) {
      return;
    }
    this._isDownloading = true;
    try {
      await this._updater.downloadUpdate();
    } catch (error) {
      this._isDownloading = false;
      logger.error('[UpdateService] download failed:', error);
      throw error;
    }
  }

  quitAndInstall(): void {
    this._updater.quitAndInstall(false, true);
  }

  private _sendToRenderer(channel: string, data?: unknown): void {
    const mainWindow = windowManager.getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data);
    }
  }
}
```

### 6.3 S3 上传服务

```typescript
// src/main/services/s3-upload.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class S3UploadService {
  private _s3Client: S3Client;

  constructor() {
    this._s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadFile(
    localFilePath: string,
    version: string,
  ): Promise<{ url: string; checksum: string }> {
    const fileBuffer = fs.readFileSync(localFilePath);
    const checksum = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    const ext = path.extname(localFilePath);
    const baseName = path.basename(localFilePath, ext);
    const s3Key = `electron/trai-${version}/${baseName}${ext}`;

    await this._s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: this._getContentType(ext),
        Metadata: {
          version,
          checksum,
        },
      }),
    );

    const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    logger.info('[S3UploadService] uploaded:', url);
    return { url, checksum };
  }

  async uploadLatestYml(version: string, ymlContent: string): Promise<void> {
    await this._s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: 'electron/latest.yml',
        Body: ymlContent,
        ContentType: 'text/yaml',
        Metadata: { version },
      }),
    );
    logger.info('[S3UploadService] latest.yml uploaded');
  }

  private _getContentType(ext: string): string {
    const map: Record<string, string> = {
      '.exe': 'application/vnd.microsoft.portable-executable',
      '.zip': 'application/zip',
      '.yml': 'text/yaml',
      '.json': 'application/json',
    };
    return map[ext] || 'application/octet-stream';
  }
}
```

### 6.4 发布脚本

```bash
# src/scripts/release.sh
#!/bin/bash
set -e

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh <version>"
  exit 1
fi

echo "Building version $VERSION..."

# 1. 构建渲染进程
pnpm --filter @trai/renderer build

# 2. 打包 Electron
pnpm electron-builder --win --config.electronBuilder.version=$VERSION

# 3. 生成 S3 latest.yml
node scripts/generate-latest-yml.js $VERSION

# 4. 上传到 S3
node scripts/upload-to-s3.js $VERSION

echo "Release $VERSION completed!"
```

### 6.5 latest.yml 格式

```yaml
version: 1.2.3
files:
  - url: trai-1.2.3.exe
    sha512: <sha512-hash>
    size: 142857600
    blockMapSize: 124880
path: trai-1.2.3.exe
sha512: <sha512-hash>
releaseDate: '2026-04-13T08:30:00.000Z'
```

### 6.6 更新通道

| 通道 | 说明 | 配置 |
|------|------|------|
| stable | 正式版，通过 S3 分发 | 默认 |
| beta | 测试版，GitHub Releases | 可选 |
| dev | 开发版，私有服务器 | 可选 |

### 6.7 IPC 更新通道

| 通道 | 方向 | 说明 |
|------|------|------|
| `update:check` | 渲染→主 | 检查更新 |
| `update:download` | 渲染→主 | 下载更新包 |
| `update:install` | 渲染→主 | 安装并重启 |
| `update:checking` | 主→渲染 | 正在检查 |
| `update:available` | 主→渲染 | 发现新版本 |
| `update:not-available` | 主→渲染 | 已是最新 |
| `update:progress` | 主→渲染 | 下载进度 |
| `update:downloaded` | 主→渲染 | 下载完成 |
| `update:error` | 主→渲染 | 更新出错 |

## 7. 日志规范

| 进程 | 日志工具 | 输出位置 |
|------|----------|----------|
| 主进程 | electron-log | `%USERPROFILE%/AppData/Roaming/trai/logs/` |
| 渲染进程 | console | 开发可见，生产通过 IPC 上报 |

```typescript
// src/main/utils/logger.ts
import electronLog from 'electron-log';

export const logger = electronLog.create({
  fileName: 'trai.log',
  maxSize: 5 * 1024 * 1024, // 5MB，超过自动滚动
  maxFiles: 5,               // 最多保留 5 个滚动文件
  format: '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export default logger;
```

<div style="background:#fee2e2;border:1px solid #fecdd3;border-left:4px solid #e11d48;border-radius:8px;padding:12px 16px;margin:14px 0;color:#881337;">
  <strong style="color:#be123c;">禁止事项</strong>：主进程中禁止使用 `console.log`，必须使用 `electron-log`
</div>

## 8. 软件更新详细流程

### 8.1 更新状态机

```
IDLE ──[启动/手动]──> CHECKING ──[有新版本]──> AVAILABLE ──[用户点击]──> DOWNLOADING ──[完成]──> DOWNLOADED ──[用户点击]──> INSTALLING ──[完成]──> IDLE
 │                        │                      │                        │                        │
 │                        └──[无更新]─────────────┘                        │
 │                                                                 │
 └──[出错]───────────────────────────────────────────> ERROR ──[重试]──> CHECKING
```

### 8.2 前端更新 Hook

```typescript
// src/renderer/hooks/use-update.ts
export function useUpdate() {
  const updateInfo = useUpdateStore((s) => s.updateInfo);
  const status = useUpdateStore((s) => s.status);
  const progress = useUpdateStore((s) => s.progress);
  const error = useUpdateStore((s) => s.error);

  const checkUpdate = useCallback(async () => {
    await window.update.check();
  }, []);

  const downloadUpdate = useCallback(async () => {
    await window.update.download();
  }, []);

  const installUpdate = useCallback(() => {
    window.update.install();
  }, []);

  // 监听主进程推送的更新事件
  useEffect(() => {
    window.on('update:available', (_e, info) => {
      useUpdateStore.getState().setUpdateAvailable(info);
    });
    window.on('update:progress', (_e, progress) => {
      useUpdateStore.getState().setProgress(progress);
    });
    window.on('update:downloaded', () => {
      useUpdateStore.getState().setDownloaded();
    });
    window.on('update:error', (_e, { message }) => {
      useUpdateStore.getState().setError(message);
    });
  }, []);

  return { updateInfo, status, progress, error, checkUpdate, downloadUpdate, installUpdate };
}
```

### 8.3 PyQt6 客户端软件更新

<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;margin:14px 0;color:#065f46;">
  <strong>PyQt6 客户端使用 S3 存储最新版本信息，通过 HTTP 请求检测更新。</strong>
</div>

```python
# src/comm/update_checker.py
class UpdateChecker:
    """软件更新检查器"""
    LATEST_URL = "https://{bucket}.s3.{region}.amazonaws.com/client/latest.json"

    def __init__(self, current_version: str) -> None:
        self._current_version = current_version

    def check(self) -> UpdateInfo | None:
        """检查是否有新版本"""
        try:
            url = self.LATEST_URL.format(
                bucket=os.getenv("S3_BUCKET"),
                region=os.getenv("AWS_REGION"),
            )
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            latest = data.get("version", "0.0.0")
            if self._compare_versions(latest, self._current_version) > 0:
                return UpdateInfo(
                    version=latest,
                    download_url=data.get("url"),
                    checksum=data.get("sha256"),
                    release_date=data.get("date"),
                    changelog=data.get("changelog"),
                )
            return None
        except requests.RequestException as e:
            logger.error(f"[UpdateChecker] check failed: {e}")
            return None

    @staticmethod
    def _compare_versions(v1: str, v2: str) -> int:
        """比较版本号，返回 1:v1更新 0:相同 -1:v2更新"""
        from packaging import version
        try:
            return version.parse(v1.replace("v", "")) > version.parse(v2.replace("v", ""))
        except Exception:
            return 0
```

```python
# src/service/update_service.py
class UpdateService:
    """更新服务，封装检查/下载/安装全流程"""

    def __init__(self, current_version: str) -> None:
        self._checker = UpdateChecker(current_version)
        self._download_path = Path.home() / ".trai" / "updates"
        self._download_path.mkdir(parents=True, exist_ok=True)

    def check_for_update(self) -> UpdateInfo | None:
        """检查更新"""
        return self._checker.check()

    async def download_update(self, info: UpdateInfo, progress_callback: Callable[[float], None]) -> Path:
        """下载更新包，带进度回调"""
        if not info.download_url:
            raise ValueError("No download URL provided")

        dest = self._download_path / f"trai-{info.version}.exe"

        async with aiohttp.ClientSession() as session:
            async with session.get(info.download_url) as resp:
                total_size = int(resp.headers.get("Content-Length", 0))
                downloaded = 0

                with open(dest, "wb") as f:
                    async for chunk in resp.content.iter_chunked(8192):
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            progress_callback(downloaded / total_size)

        # 校验 SHA256
        file_hash = hashlib.sha256(dest.read_bytes()).hexdigest()
        if file_hash != info.checksum:
            dest.unlink()
            raise ValueError(f"Checksum mismatch: expected {info.checksum}, got {file_hash}")

        return dest

    def install_update(self, installer_path: Path) -> None:
        """启动安装程序并退出当前应用"""
        import subprocess
        subprocess.Popen(
            [str(installer_path), "/SILENT", "/CLOSEAPPLICATIONS"],
            creationflags=subprocess.DETACHED_PROCESS,
        )
        QApplication.quit()
```

### 8.4 更新配置文件格式

```json
// client/latest.json (存储在 S3)
{
  "version": "1.2.3",
  "url": "https://bucket.s3.region.amazonaws.com/client/trai-1.2.3.exe",
  "sha256": "abc123...",
  "date": "2026-04-13",
  "size": 142857600,
  "changelog": [
    "修复了聊天消息丢失的问题",
    "优化了首次启动速度",
    "新增多会话管理功能"
  ],
  "min_compatible": "1.0.0",
  "os": "windows"
}
```

## 9. 全局禁令

<div style="background:#fee2e2;border:1px solid #fecdd3;border-radius:8px;padding:12px 16px;margin:14px 0;">
  <strong style="color:#C62828;">全局禁令（所有客户端必须遵守）</strong>
</div>

| 禁令类型 | 禁止内容 | 正确替代 |
|----------|----------|----------|
| 颜色禁令 | `purple, violet, indigo, #9333EA, #7C3AED` | `blue, cyan, teal, emerald, amber` |
| 深色背景 | `#080818` 或 `#0F172A` | 统一使用 |
| 标点禁令 | 中文全角标点 `，。！？：` | 半角英文标点 `,.!?:` |
| 主进程日志 | `console.log` | `electron-log` |
| 渲染进程网络 | 直接 fetch/axios | 通过 preload API |
| Renderer 导入 | `import electron` | 通过 `window.xxx` API |
| 危险配置 | `nodeIntegration: true` | `false` |

## 10. 依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (Renderer)                       │
│  React Components / Zustand / Tailwind CSS                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ChatPanel ──> MessageList ──> MessageItem           │   │
│  │  useChatStore() <── useAuthStore()                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ window.chat.send()
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               Controller Layer (Preload)                    │
│  contextBridge.exposeInMainWorld('chat', {...})            │
│  唯一出口，所有 Renderer → Main 通信必须经过此处              │
└────────────────────────────┬────────────────────────────────┘
                             │ ipcRenderer.invoke('chat:send')
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  IPC Layer (Main Process)                   │
│  ipcMain.handle('chat:send', handler)                      │
│  参数校验 + 错误捕获                                         │
└────────────────────────────┬────────────────────────────────┘
                             │ new ChatService().send()
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                Service Layer (Main Process)                 │
│  ChatService / AuthService / UpdateService                  │
│  业务流程编排 + Backend API 调用                             │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                              │
              ▼                              ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│     Platform Layer       │  │        Platform Layer        │
│  FileSystem / Clipboard  │  │  Notification / Shell       │
└──────────────────────────┘  └──────────────────────────────┘
              │
              ▼
┌──────────────────────────┐
│    Backend API (REST)    │
│    http://localhost:5666 │
└──────────────────────────┘
```

## 11. 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式（同时启动主进程和渲染进程热重载）
pnpm dev

# 类型检查
pnpm type-check

# 构建生产版本
pnpm build

# 打包应用（生成可执行文件）
pnpm package

# 打包所有平台
pnpm package:all

# 发布（构建 + 打包 + 上传 S3）
pnpm release

# 检查更新
pnpm update:check
```

---

<div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:8px;padding:10px 14px;margin:12px 0;font-family:ui-monospace,monospace;font-size:0.88em;color:#475569;">
  <em>编写说明：本架构文档基于 `.cursor/skills/electron/SKILL.md` 规范制定，强制执行五层架构、IPC 通道规范、渲染进程安全配置、自动更新与 S3 上传流程。</em>
</div>