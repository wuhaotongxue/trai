/**
 * 文件名: panel_consistency.ts
 * 作者: wuhao
 * 日期: 2026-05-28 15:12:09
 * 描述: Agent 面板细节一致性常量, 统一空态文案、英文副标题和微动画节奏
 */

/**
 * Agent 面板微动画节奏配置.
 *
 * 返回:
 *   无. 作为常量导出供多个面板共享.
 */
export const PANEL_MOTION_TOKENS = {
  sweep_duration: 1.3,
  pulse_duration: 1.4,
  float_duration: 1.4,
} as const;

/**
 * Agent 面板空态文案集合.
 *
 * 返回:
 *   无. 作为常量导出供多个面板共享.
 */
export const PANEL_EMPTY_COPY = {
  waiting_input_title: "等待输入开始",
  waiting_input_desc: "输入提示词或上传文件后, 结果会在这里展开.",
  waiting_history_title: "等待第一条记录",
  waiting_history_desc: "当前工具生成后的作品与记录, 会按时间顺序出现在这里.",
  waiting_task_title: "等待任务开始",
  waiting_task_desc: "从左侧提交任务后, 这里会显示处理中状态和最终结果.",
} as const;

/**
 * Agent 面板统一英文副标题.
 *
 * 返回:
 *   无. 作为常量导出供多个面板共享.
 */
export const PANEL_SUBTITLES = {
  tool_rail: "Tool Rail",
  config_rail: "Config Rail",
  chat_rail: "Chat Rail",
  gallery_rail: "Gallery Rail",
  result_stage: "Result Stage",
  history_track: "History Track",
  current_result: "Current Result",
  system_notes: "System Notes",
  processing_feedback: "Processing Feedback",
} as const;
