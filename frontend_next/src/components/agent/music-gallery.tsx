/* eslint-disable */
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
import { Music, Trash2 } from "lucide-react";

type GalleryViewMode = "grid" | "list";
type MusicItem = { id: string; url: string; prompt: string; timestamp: number; isCurrent: boolean };

const PAGE_SIZE = 20;

interface MusicGalleryProps {
  currentMusic: MusicItem[];
  historyMusic: MusicItem[];
  viewMode: GalleryViewMode;
  onDelete: (id: string) => void;
}

/**
 * 音乐卡片组件
 */
function MusicCardItem({
  music,
  isCurrent,
  viewMode,
  onDelete
}: {
  music: MusicItem;
  isCurrent: boolean;
  viewMode: GalleryViewMode;
  onDelete?: (id: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`group relative rounded-xl border overflow-hidden transition-all hover:shadow-md ${isCurrent ? 'border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5' : 'border-border bg-card hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
      <audio
        ref={audioRef}
        src={music.url}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="p-3">
        {/* 标题和播放按钮 */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isCurrent ? 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/20' : 'bg-muted'}`}>
            <Music className={`h-5 w-5 ${isCurrent ? 'text-indigo-500' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate" title={music.prompt}>
              {music.prompt}
            </p>
            <p className={`text-[10px] ${isCurrent ? 'text-indigo-500' : 'text-muted-foreground'}`}>
              {isCurrent ? '当前生成' : new Date(music.timestamp).toLocaleString()}
            </p>
          </div>
          {/* 播放按钮 */}
          <button
            onClick={togglePlay}
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20'
            }`}
          >
            {isPlaying ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* 删除按钮 */}
        {!isCurrent && onDelete && (
          <div className="flex justify-end">
            <button
              onClick={() => onDelete(music.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-red-500/10 text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 翻页组件
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
    <div className="flex items-center justify-center gap-1 py-2 border-t border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-7 px-2 text-xs"
      >
        上一页
      </Button>
      {startPage > 1 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onPageChange(1)} className="h-7 w-8 p-0 text-xs">
            1
          </Button>
          {startPage > 2 && <span className="px-1 text-xs text-muted-foreground">...</span>}
        </>
      )}
      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "ghost"}
          size="sm"
          onClick={() => onPageChange(page)}
          className={`h-7 w-8 p-0 text-xs ${page === currentPage ? 'bg-indigo-500 hover:bg-indigo-600' : ''}`}
        >
          {page}
        </Button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-xs text-muted-foreground">...</span>}
          <Button variant="ghost" size="sm" onClick={() => onPageChange(totalPages)} className="h-7 w-8 p-0 text-xs">
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-7 px-2 text-xs"
      >
        下一页
      </Button>
    </div>
  );
}

/**
 * 音乐画廊组件
 */
export function MusicGallery({
  currentMusic,
  historyMusic,
  viewMode,
  onDelete
}: MusicGalleryProps) {
  const [historyPage, setHistoryPage] = useState(1);

  const totalPages = Math.ceil(historyMusic.length / PAGE_SIZE);
  const startIndex = (historyPage - 1) * PAGE_SIZE;
  const paginatedHistory = historyMusic.slice(startIndex, startIndex + PAGE_SIZE);

  if (currentMusic.length === 0 && historyMusic.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Music className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-sm text-muted-foreground">还没有生成过音乐</p>
        <p className="text-xs text-muted-foreground mt-1">在音乐模式下生成音乐</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* 当前结果区 */}
          {currentMusic.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-1 mb-2">
                当前结果
              </p>
              <div className="space-y-2">
                {currentMusic.map((item) => (
                  <MusicCardItem key={item.id} music={item} isCurrent={true} viewMode={viewMode} />
                ))}
              </div>
            </div>
          )}

          {/* 历史记录区 */}
          {paginatedHistory.length > 0 && (
            <div>
              {currentMusic.length > 0 && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                  历史记录 ({historyMusic.length})
                </p>
              )}
              <div className="space-y-2">
                {paginatedHistory.map((item) => (
                  <MusicCardItem key={item.id} music={item} isCurrent={false} viewMode={viewMode} onDelete={onDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 翻页控件 */}
      <Pagination
        currentPage={historyPage}
        totalPages={totalPages}
        onPageChange={setHistoryPage}
      />
    </div>
  );
}
