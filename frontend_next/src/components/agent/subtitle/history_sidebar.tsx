import { motion } from "framer-motion";
import { Loader2, Trash2, Captions, Music, Languages, MonitorPlay, Type } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll_area";
import { cn } from "@/lib/utils";
import { SubtitleRecordDTO } from "./types";

interface HistorySidebarProps {
  showGallery: boolean;
  isLoadingHistory: boolean;
  history: SubtitleRecordDTO[];
  currentHistory: SubtitleRecordDTO[];
  activeRecord: SubtitleRecordDTO | null;
  historyPage: number;
  totalPages: number;
  setActiveRecord: (record: SubtitleRecordDTO) => void;
  handleDelete: (taskId: string) => void;
  fetchHistory: () => void;
  setHistoryPage: (page: number | ((p: number) => number)) => void;
}

/**
 * 字幕工具历史侧栏组件.
 *
 * @param props 历史记录列表、分页与删除交互参数.
 * @returns 与 Agent 主界面统一风格的右侧历史栏.
 */
export function HistorySidebar({
  showGallery,
  isLoadingHistory,
  history,
  currentHistory,
  activeRecord,
  historyPage,
  totalPages,
  setActiveRecord,
  handleDelete,
  fetchHistory,
  setHistoryPage,
}: HistorySidebarProps) {
  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  const brutalShadow = "shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]";
  if (!showGallery) return null;

  return (
    <motion.div 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className={`w-80 h-full flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 ${brutalBorder} border-r-0 border-t-0 border-b-0 relative z-10`}
    >
      <div className="p-4 border-b-2 border-slate-900 dark:border-white bg-cyan-200 dark:bg-slate-200 text-slate-900 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider">影音长廊</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">History Rail</p>
        </div>
        <button type="button" onClick={() => fetchHistory()} className="text-xs font-bold uppercase hover:text-slate-600 transition-colors flex items-center gap-1">
          <Loader2 className={cn("w-3 h-3", isLoadingHistory && "animate-spin")} />
          刷新
        </button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoadingHistory && history.length === 0 ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : currentHistory.length > 0 ? (
            currentHistory.map((record) => (
              <div
                key={record.task_id}
                onClick={() => setActiveRecord(record)}
                className={cn(
                  `p-4 cursor-pointer transition-all ${brutalBorder} relative group`,
                  activeRecord?.task_id === record.task_id
                    ? "bg-cyan-100 dark:bg-slate-100 text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]"
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record.task_id);
                  }}
                  className={cn(
                    `absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${brutalBorder}`,
                    activeRecord?.task_id === record.task_id ? "bg-white text-slate-900 hover:bg-red-500 hover:text-white" : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-red-500 hover:text-white"
                  )}
                  title="删除记录"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="font-bold text-sm line-clamp-1 pr-8 mb-2">
                  {record.file_name}
                </div>
                
                <div className="flex justify-between items-center text-xs font-bold uppercase mt-3">
                  <span className="opacity-70">{new Date(record.created_at).toLocaleDateString()}</span>
                  <span className={cn(
                    `px-2 py-1 ${brutalBorder}`,
                    record.status === "completed" ? "bg-emerald-200 text-emerald-800" :
                    record.status === "failed" ? "bg-red-200 text-red-800" :
                    "bg-cyan-200 text-cyan-800"
                  )}>
                    {record.status === "completed" ? "已完成" : record.status === "failed" ? "失败" : "处理中"}
                  </span>
                </div>
                
                <div className="mt-3 text-xs font-bold opacity-80 uppercase flex items-center gap-1">
                  {record.task_type === "separate" ? <><Music className="w-3 h-3"/> 人声分离</> : 
                   record.task_type === "clone" ? <><Languages className="w-3 h-3"/> 声音克隆</> : 
                   record.task_type === "lipsync" ? <><MonitorPlay className="w-3 h-3"/> 口型同步</> : 
                   record.task_type === "to_audio" ? <><Type className="w-3 h-3"/> 视频转音频</> : 
                   <><Captions className="w-3 h-3"/> 字幕生成</>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm font-bold uppercase opacity-50 py-8">
              暂无历史记录
            </div>
          )}
        </div>
      </ScrollArea>
      
      {totalPages > 1 && (
        <div className="p-4 border-t-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-950 flex justify-between items-center">
          <button
            type="button"
            disabled={historyPage <= 1}
            onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
            className={`px-3 py-1 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadow} disabled:opacity-50 text-xs font-bold uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
          >
            上一页
          </button>
          <span className="text-xs font-bold">
            {historyPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={historyPage >= totalPages}
            onClick={() => setHistoryPage((p) => Math.min(totalPages, p + 1))}
            className={`px-3 py-1 bg-white dark:bg-slate-900 ${brutalBorder} ${brutalShadow} disabled:opacity-50 text-xs font-bold uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
          >
            下一页
          </button>
        </div>
      )}
    </motion.div>
  );
}
