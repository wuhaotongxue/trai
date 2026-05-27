export type BurnMode = "none" | "zh" | "target" | "bilingual";
export type TaskType = "subtitle" | "separate" | "clone" | "lipsync" | "to_audio";

export interface SubtitleGenerateResponse {
  task_id: string;
  status: string;
  input_type: "video" | "audio";
  target_lang: string;
  burn_mode: BurnMode;
  zh_srt_url: string | null;
  target_srt_url: string | null;
  output_video_url: string | null;
  vocal_url?: string | null;
  bgm_url?: string | null;
  object_prefix: string;
  audio_url?: string | null;
}

export interface SubtitleRecordDTO {
  task_id: string;
  task_type: string;
  file_name: string;
  target_lang: string;
  burn_mode: string;
  status: string;
  zh_srt_url: string | null;
  target_srt_url: string | null;
  output_video_url: string | null;
  vocal_url?: string | null;
  bgm_url?: string | null;
  error_message: string | null;
  created_at: string;
}

export const TARGET_LANG_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "英文", value: "en" },
  { label: "日文", value: "ja" },
  { label: "韩文", value: "ko" },
  { label: "法文", value: "fr" },
  { label: "德文", value: "de" },
  { label: "西班牙文", value: "es" },
  { label: "俄文", value: "ru" },
];
