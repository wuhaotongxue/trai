 
/**
 * music-gallery.tsx
 * 作者: wuhao
 * 日期: 2026-05-21
 * 描述: 音乐廊组件 - 显示音乐历史记录和播放功能
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { Music, Trash2, PlayCircle, X } from "lucide-react";
import { PANEL_EMPTY_COPY, PANEL_SUBTITLES } from "./panel_consistency";
import { MusicPlayer } from "./music_player";

type GalleryViewMode = "grid" | "list";
type MusicItem = { 
  id: string; 
  url: string; 
  prompt: string; 
  timestamp: number; 
  isCurrent: boolean;
  lyrics?: string | null;
  cover_url?: string | null;
};

const PAGE_SIZE = 20;

interface MusicGalleryProps {
  currentMusic: MusicItem[];
  historyMusic: MusicItem[];
  viewMode: GalleryViewMode;
  onDelete: (id: string) => void;
}

/**
 * 音乐卡片组件.
 *
 * @param props 单条音乐记录和操作参数.
 * @returns 统一风格的音乐卡片.
 */
function MusicCardItem({
  music,
  isCurrent,
  viewMode,
  onDelete,
  onPlay
}: {
  music: MusicItem;
  isCurrent: boolean;
  viewMode: GalleryViewMode;
  onDelete?: (id: string) => void;
  onPlay: (music: MusicItem) => void;
}) {
  const brutalBorder = "border-2 border-slate-900 dark:border-white";

  return (
    <div className={`group relative overflow-hidden transition-all ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] ${isCurrent ? 'bg-cyan-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-900 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0f172a] dark:hover:shadow-[6px_6px_0px_0px_#ffffff]'}`}>
      <div className="p-4">
        {/* 标题和播放按钮 */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] ${isCurrent ? 'bg-cyan-100 dark:bg-cyan-900' : 'bg-slate-50 dark:bg-cyan-600'}`}>
            {music.cover_url ? (
              <img src={music.cover_url} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <Music className={`h-6 w-6 text-slate-900 dark:text-white`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white truncate" title={music.prompt}>
              {music.prompt}
            </p>
            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isCurrent ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {isCurrent ? '当前生成' : new Date(music.timestamp).toLocaleString()}
            </p>
          </div>
          {/* 播放按钮 */}
          <button
            onClick={() => onPlay(music)}
            className={`shrink-0 w-10 h-10 flex items-center justify-center transition-all ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100`}
          >
            <PlayCircle className="h-6 w-6" />
          </button>
        </div>

        {/* 删除按钮 */}
        {!isCurrent && onDelete && (
          <div className="flex justify-end">
            <button
              onClick={() => onDelete(music.id)}
              className={`flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 text-xs font-black uppercase text-slate-900 dark:text-white hover:text-white transition-colors ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 翻页组件.
 *
 * @param props 当前页、总页数和翻页回调.
 * @returns 统一风格的分页控件.
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 py-3 border-t-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-950">
      <Button
        type="button"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`h-8 px-3 text-xs rounded-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50`}
      >
        上一页
      </Button>
      {startPage > 1 && (
        <>
          <Button type="button" size="sm" onClick={() => onPageChange(1)} className={`h-8 w-8 p-0 text-xs rounded-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${brutalBorder}`}>
            1
          </Button>
          {startPage > 2 && <span className="px-1 text-xs text-slate-500">...</span>}
        </>
      )}
      {pageNumbers.map((page) => (
        <Button
          type="button"
          key={page}
          size="sm"
          onClick={() => onPageChange(page)}
          className={`h-8 w-8 p-0 text-xs rounded-none ${brutalBorder} ${
            page === currentPage ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
          }`}
        >
          {page}
        </Button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-xs text-slate-500">...</span>}
          <Button type="button" size="sm" onClick={() => onPageChange(totalPages)} className={`h-8 w-8 p-0 text-xs rounded-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${brutalBorder}`}>
            {totalPages}
          </Button>
        </>
      )}
      <Button
        type="button"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`h-8 px-3 text-xs rounded-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] disabled:opacity-50`}
      >
        下一页
      </Button>
    </div>
  );
}

/**
 * 音乐画廊组件.
 *
 * @param props 当前音乐、历史音乐和删除回调.
 * @returns 统一风格的音乐廊.
 */
export function MusicGallery({
  currentMusic,
  historyMusic,
  viewMode,
  onDelete
}: MusicGalleryProps) {
  const [historyPage, setHistoryPage] = useState(1);
  const [activePlayerMusic, setActivePlayerMusic] = useState<MusicItem | null>(null);

  const totalPages = Math.ceil(historyMusic.length / PAGE_SIZE);
  const startIndex = (historyPage - 1) * PAGE_SIZE;
  const paginatedHistory = historyMusic.slice(startIndex, startIndex + PAGE_SIZE);

  if (currentMusic.length === 0 && historyMusic.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-32 h-32 bg-cyan-100 border-4 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] flex items-center justify-center mb-6">
          <Music className="h-16 w-16 text-slate-900" />
        </div>
        <p className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white">{PANEL_EMPTY_COPY.waiting_history_title}</p>
        <p className="text-sm font-bold uppercase mt-2 text-slate-500 dark:text-slate-400">{PANEL_EMPTY_COPY.waiting_history_desc}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* 梦幻播放器浮层 */}
      {activePlayerMusic && (
        <div className="absolute inset-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm p-4 flex flex-col">
          <MusicPlayer 
            url={activePlayerMusic.url}
            title={activePlayerMusic.prompt}
            coverUrl={activePlayerMusic.cover_url}
            lyrics={activePlayerMusic.lyrics}
            onClose={() => setActivePlayerMusic(null)}
          />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* 当前结果区 */}
          {currentMusic.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em] px-1 mb-2">
                {PANEL_SUBTITLES.current_result}
              </p>
              <div className="space-y-2">
                {currentMusic.map((item) => (
                  <MusicCardItem 
                    key={item.id} 
                    music={item} 
                    isCurrent={true} 
                    viewMode={viewMode} 
                    onPlay={setActivePlayerMusic}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 历史记录区 */}
          {paginatedHistory.length > 0 && (
            <div>
              {currentMusic.length > 0 && (
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 mb-2">
                  {PANEL_SUBTITLES.history_track} ({historyMusic.length})
                </p>
              )}
              <div className="space-y-2">
                {paginatedHistory.map((item) => (
                  <MusicCardItem 
                    key={item.id} 
                    music={item} 
                    isCurrent={false} 
                    viewMode={viewMode} 
                    onDelete={onDelete} 
                    onPlay={setActivePlayerMusic}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 翻页控件 */}
      {!activePlayerMusic && (
        <Pagination
          currentPage={historyPage}
          totalPages={totalPages}
          onPageChange={setHistoryPage}
        />
      )}
    </div>
  );
}
