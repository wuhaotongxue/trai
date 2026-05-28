 
/**
 * media-gallery.tsx
 * 作者: wuhao
 * 日期: 2026-05-21
 * 描述: 图片/视频画廊组件 - 显示历史记录，支持翻页
 */

"use client";

import { useState } from "react";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { Image as ImageIcon, Video, Trash2, ExternalLink } from "lucide-react";

type GalleryViewMode = "grid" | "list";
type MediaItem = { id: string; url: string; prompt: string; timestamp: number; isCurrent: boolean };

const PAGE_SIZE = 20;

interface MediaGalleryProps {
  currentItems: MediaItem[];
  historyItems: MediaItem[];
  viewMode: GalleryViewMode;
  isVideo: boolean;
  searchQuery: string;
  sortType: "latest" | "oldest";
  onDelete: (id: string) => void;
  onPreview: (url: string) => void;
  onDownload: (url: string) => void;
}

/**
 * 翻页组件.
 *
 * @param props 当前页、总页数和翻页回调.
 * @returns 统一风格的分页导航.
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
            page === currentPage ? "bg-cyan-500 hover:bg-cyan-400 text-slate-900" : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
 * 媒体画廊组件.
 *
 * @param props 当前结果、历史记录和媒体操作参数.
 * @returns 统一风格的图片或视频画廊.
 */
export function MediaGallery({
  currentItems,
  historyItems,
  viewMode,
  isVideo,
  searchQuery,
  sortType,
  onDelete,
  onPreview,
  onDownload
}: MediaGalleryProps) {
  const [historyPage, setHistoryPage] = useState(1);

  // 过滤和排序
  const filterItems = (items: MediaItem[]) => {
    if (!searchQuery) return items;
    return items.filter((item) => item.prompt.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  let filteredHistory = filterItems(historyItems);
  if (sortType === "latest") {
    filteredHistory = filteredHistory.sort((a, b) => b.timestamp - a.timestamp);
  } else {
    filteredHistory = filteredHistory.sort((a, b) => a.timestamp - b.timestamp);
  }

  const totalPages = Math.ceil(filteredHistory.length / PAGE_SIZE);
  const startIndex = (historyPage - 1) * PAGE_SIZE;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + PAGE_SIZE);
  const filteredCurrent = filterItems(currentItems);

  if (filteredCurrent.length === 0 && paginatedHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-16 h-16 rounded-none bg-cyan-100 dark:bg-cyan-900 border-2 border-slate-900 dark:border-white flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_#0f172a]">
          {isVideo ? (
            <Video className="h-8 w-8 text-slate-400" />
          ) : (
            <ImageIcon className="h-8 w-8 text-slate-400" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isVideo ? "还没有生成过视频" : "还没有生成过图片"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isVideo ? "在视频模式下生成视频" : "在绘图或编辑模式下生成图片"}
        </p>
      </div>
    );
  }

  const allItems = [...filteredCurrent, ...paginatedHistory];

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className={`p-2 ${viewMode === "grid" ? "space-y-2" : "space-y-1"}`}>
          {/* 当前结果区 */}
          {filteredCurrent.length > 0 && (
            <div className="mb-3">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] px-1 mb-2 ${isVideo ? 'text-orange-600 dark:text-orange-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                当前结果
              </p>
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-1"}>
                {filteredCurrent.map((item) => (
                  <MediaCardItem
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    isVideo={isVideo}
                    isCurrent={true}
                    onPreview={onPreview}
                    onDownload={onDownload}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 历史记录区 */}
          {paginatedHistory.length > 0 && (
            <div>
              {filteredCurrent.length > 0 && (
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 mb-2">
                  历史记录 ({filteredHistory.length})
                </p>
              )}
              {paginatedHistory.map((item) => (
                <MediaCardItem
                  key={item.id}
                  item={item}
                  viewMode={viewMode}
                  isVideo={isVideo}
                  isCurrent={false}
                  onDelete={onDelete}
                  onPreview={onPreview}
                  onDownload={onDownload}
                />
              ))}
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

/**
 * 媒体卡片组件.
 *
 * @param props 单条媒体记录与操作回调.
 * @returns 图片或视频卡片.
 */
function MediaCardItem({
  item,
  viewMode,
  isVideo,
  isCurrent,
  onDelete,
  onPreview,
  onDownload
}: {
  item: MediaItem;
  viewMode: GalleryViewMode;
  isVideo: boolean;
  isCurrent: boolean;
  onDelete?: (id: string) => void;
  onPreview: (url: string) => void;
  onDownload: (url: string) => void;
}) {
  const brutalBorder = "border-2 border-slate-900 dark:border-white";
  return (
    <div className={`group relative rounded-none overflow-hidden ${brutalBorder} shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] transition-all ${viewMode === "grid" ? "" : "flex items-center gap-3"} ${isVideo ? 'bg-orange-50 dark:bg-slate-900' : isCurrent ? 'bg-cyan-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-900'}`}>
      {/* 媒体内容 */}
      {isVideo ? (
        <div className="overflow-hidden cursor-pointer" onClick={() => window.open(item.url, "_blank")}>
          <video src={item.url} className={`hover:scale-105 transition-transform ${viewMode === "grid" ? "w-full aspect-video" : "w-16 h-16 object-cover"}`} />
        </div>
      ) : (
        <div className="overflow-hidden cursor-pointer flex-shrink-0" onClick={() => onPreview(item.url)}>
          <Image src={item.url} alt={item.id === "current-generated" ? "生成的图片" : "编辑结果"} width={viewMode === "grid" ? 512 : 64} height={viewMode === "grid" ? 512 : 64} unoptimized className={`object-cover hover:scale-105 transition-transform ${viewMode === "grid" ? "w-full aspect-square" : "w-16 h-16"}`} />
        </div>
      )}

      {/* 列表视图信息 */}
      {viewMode === "list" && (
        <div className="flex-1 min-w-0 p-2">
          <p className="text-xs text-foreground truncate" title={item.prompt}>{item.prompt}</p>
          <p className={`text-[10px] mt-0.5 font-black uppercase tracking-wider ${isVideo ? 'text-orange-600 dark:text-orange-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
            {isVideo ? (item.id === "current-generated" ? "视频生成" : "视频生成") : (item.id === "current-generated" ? "绘图生成" : "图片编辑")}
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className={`absolute ${viewMode === "grid" ? "inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2" : "right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"}`}>
        {!isVideo && (
          <Button type="button" size="icon" variant="secondary" className={`h-6 w-6 rounded-none bg-white/90 hover:bg-white text-slate-800 ${brutalBorder}`} onClick={() => onDownload(item.url)} title="下载">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </Button>
        )}
        <Button type="button" size="icon" variant="secondary" className={`h-6 w-6 rounded-none bg-white/90 hover:bg-white text-slate-800 ${brutalBorder}`} onClick={() => window.open(item.url, "_blank")} title="打开">
          <ExternalLink className="h-3 w-3" />
        </Button>
        {!isCurrent && onDelete && (
          <Button type="button" size="icon" variant="secondary" className={`h-6 w-6 rounded-none bg-red-500/90 hover:bg-red-500 text-white ${brutalBorder}`} onClick={() => onDelete(item.id)} title="删除">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 网格视图底部信息 */}
      {viewMode === "grid" && (
        <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-[10px] text-white truncate" title={item.prompt}>{item.prompt}</p>
        </div>
      )}
    </div>
  );
}
