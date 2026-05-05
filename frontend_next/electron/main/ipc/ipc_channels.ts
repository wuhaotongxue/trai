/**
 * 文件名: electron/main/ipc/ipc_channels.ts
 * 作者: wuhao
 * 日期: 2026-05-04 22:00:00
 * 描述: IPC通道定义和类型安全通信协议
 */

export enum IPCChannel {
  // Window Management
  WINDOW_MINIMIZE = "window:minimize",
  WINDOW_MAXIMIZE = "window:maximize",
  WINDOW_CLOSE = "window:close",
  WINDOW_TOGGLE_FULLSCREEN = "window:toggleFullscreen",
  WINDOW_SET_BOUNDS = "window:setBounds",
 _WINDOW_STATE_CHANGED = "_window:stateChanged",

  // Application Info
  APP_GET_VERSION = "app:getVersion",
  APP_GET_OS_INFO = "app:getOsInfo",
  APP_QUIT = "app:quit",

  // File System Operations
  FS_READ_FILE = "fs:readFile",
  FS_WRITE_FILE = "fs:writeFile",
  FS_EXISTS = "fs:exists",
  FS_STAT = "fs:stat",
  FS_DELETE = "fs:delete",
  FS_COPY = "fs:copy",
  FS_MOVE = "fs:move",
  FS_LIST_DIR = "fs:listDir",
  FS_SELECT_FILE = "fs:selectFile",
  FS_SELECT_FOLDER = "fs:selectFolder",
  _FS_WATCH = "_fs:watch",
  _FS_UNWATCH = "_fs:unwatch",

  // Shell Operations
  SHELL_OPEN_EXTERNAL = "shell:openExternal",
  SHELL_SHOW_ITEM_IN_FOLDER = "shell:showItemInFolder",
  SHELL_OPEN_PATH = "shell:openPath",

  // Clipboard Operations
  CLIPBOARD_READ_TEXT = "clipboard:readText",
  CLIPBOARD_WRITE_TEXT = "clipboard:writeText",
  CLIPBOARD_READ_IMAGE = "clipboard:readImage",
  CLIPBOARD_WRITE_IMAGE = "clipboard:writeImage",
  _CLIPBOARD_CHANGED = "_clipboard:changed",

  // Notification System
  NOTIFICATION_SHOW = "notification:show",
  NOTIFICATION_REQUEST_PERMISSION = "notification:requestPermission",

  // Multimodal Processing (AI Features)
  MULTIMODAL_ANALYZE_IMAGE = "multimodal:analyzeImage",
  MULTIMODAL_TRANSCRIBE_AUDIO = "multimodal:transcribeAudio",
  MULTIMODAL_PARSE_PDF = "multimodal:parsePdf",
  MULTIMODAL_EXTRACT_VIDEO_THUMBNAIL = "multimodal:extractVideoThumbnail",
  MULTIMODAL_GET_VIDEO_METADATA = "multimodal:getVideoMetadata",

  // Auto Update
  UPDATER_CHECK_FOR_UPDATES = "updater:checkForUpdates",
  UPDATER_DOWNLOAD_UPDATE = "updater:downloadUpdate",
  UPDATER_QUIT_AND_INSTALL = "updater:quitAndInstall",
  _UPDATER_UPDATE_AVAILABLE = "_updater:updateAvailable",
  _UPDATER_DOWNLOAD_PROGRESS = "_updater:downloadProgress",
  _UPDATER_UPDATE_DOWNLOADED = "_updater:updateDownloaded",
  _UPDATER_ERROR = "_updater:error",

  // Settings & Config
  SETTINGS_GET = "settings:get",
  SETTINGS_SET = "settings:set",
 _SETTINGS_CHANGED = "_settings:changed",

  // Authentication
  AUTH_STORE_TOKEN = "auth:storeToken",
  AUTH_GET_TOKEN = "auth:getToken",
  AUTH_CLEAR_TOKEN = "auth:clearToken",

  // Database Operations
  DB_EXECUTE = "db:execute",
  DB_QUERY = "db:query",
  DB_BACKUP = "db:backup",
  DB_RESTORE = "db:restore",

  // Logging
  LOG_SEND = "log:send",
}

export interface IPCRequest<T = unknown> {
  id?: string;
  channel: IPCChannel;
  payload: T;
  timestamp: number;
}

export interface IPCResponse<T = unknown> {
  id?: string;
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface IPCEmitterEvent {
  channel: string;
  data: unknown;
}
