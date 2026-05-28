 
/**
 * gallery-panel.tsx
 * 作者: wuhao
 * 日期: 2026-05-21
 * 描述: 画廊面板组件 - 右侧画廊容器
 */

"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { Video, Image as ImageIcon, Music, Trash2, ExternalLink } from "lucide-react";
import { MediaGallery } from "./media-gallery";
import { MusicGallery } from "./music-gallery";

type GalleryViewMode = "grid" | "list";
type GallerySortType = "latest" | "oldest";
type TabId = "chat" | "image" | "video" | "music" | "audio" | "image_edit" | "subtitle" | "digital_human";

interface GalleryPanelProps {
  activeTab: TabId;
  showGallery: boolean;
  isGalleryMaximized: boolean;
  galleryViewMode: GalleryViewMode;
  gallerySortType: GallerySortType;
  gallerySearchQuery: string;
  imageGallery: Array<{ id: string; url: string; prompt: string; timestamp: number }>;
  videoGallery: Array<{ id: string; url: string; prompt: string; timestamp: number }>;
  musicGallery: Array<{ id: string; url: string; prompt: string; timestamp: number }>;
  generatedImageUrl: string | null;
  imagePrompt: string;
  editedImageUrl: string | null;
  imageEditPrompt: string;
  generatedVideoUrl: string | null;
  videoPrompt: string;
  generatedMusicUrl: string | null;
  musicPrompt: string;
  onToggleGallery: () => void;
  onToggleViewMode: () => void;
  onToggleMaximize: () => void;
  onClearGallery: () => void;
  onRemoveFromImageGallery: (id: string) => void;
  onRemoveFromVideoGallery: (id: string) => void;
  onRemoveFromMusicGallery: (id: string) => void;
  onPreviewImage: (url: string) => void;
  onDownloadImage: (url: string) => void;
  onSetSearchQuery: (query: string) => void;
  onSetSortType: (type: GallerySortType) => void;
}

/**
 * 画廊头部组件.
 *
 * @param props 当前标签页、视图模式和画廊控制参数.
 * @returns 统一风格的画廊标题条.
 */
function GalleryHeader({
  activeTab,
  itemCount,
  viewMode,
  isMaximized,
  onToggleViewMode,
  onToggleMaximize,
  onClear,
}: {
  activeTab: TabId;
  itemCount: number;
  viewMode: GalleryViewMode;
  isMaximized: boolean;
  onToggleViewMode: () => void;
  onToggleMaximize: () => void;
  onClear: () => void;
}) {
  const title = activeTab === "image" || activeTab === "image_edit" ? "图片廊" : activeTab === "video" ? "视频廊" : activeTab === "subtitle" ? "影音画廊" : "音乐廊";
  const brutalBorder = "border-2 border-slate-900 dark:border-white";

  return (
    <div className="flex items-center justify-between p-4 border-b-2 border-slate-900 dark:border-white bg-cyan-200 dark:bg-slate-200">
      <div className="flex items-center gap-3">
        <div>
          <span className="text-base font-black uppercase tracking-widest text-slate-900">{title}</span>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Gallery Rail</div>
        </div>
        <span className={`text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-0.5 ${brutalBorder}`}>({itemCount})</span>
      </div>
      <div className="flex items-center gap-2">
        {itemCount > 0 && (
          <>
            <button
              type="button"
              className={`h-8 w-8 flex items-center justify-center bg-white dark:bg-slate-800 ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all`}
              onClick={onToggleViewMode}
              title={viewMode === "grid" ? "列表视图" : "网格视图"}
            >
              {viewMode === "grid" ? (
                <svg className="h-4 w-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={`h-8 w-8 flex items-center justify-center bg-white dark:bg-slate-800 ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all`}
              onClick={onToggleMaximize}
              title={isMaximized ? "还原大小" : "最大化"}
            >
              {isMaximized ? (
                <svg className="h-4 w-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={onClear}
              className={`flex items-center gap-1 h-8 px-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 dark:text-white text-xs font-black uppercase tracking-wider ${brutalBorder} shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all`}
            >
              <Trash2 className="h-3 w-3" />
              清空
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 搜索和排序组件.
 *
 * @param props 搜索词、排序方式和变更回调.
 * @returns 统一风格的搜索排序条.
 */
function GallerySearchBar({
  searchQuery,
  sortType,
  itemCount,
  onSearchChange,
  onSortChange,
}: {
  searchQuery: string;
  sortType: GallerySortType;
  itemCount: number;
  onSearchChange: (query: string) => void;
  onSortChange: (type: GallerySortType) => void;
}) {
  return (
    <div className="p-3 border-b-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-950">
      <div className="relative mb-2">
        <svg className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索提示词..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs rounded-none border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:outline-none"
        />
      </div>
      <div className="flex items-center justify-between">
        <select
          value={sortType}
          onChange={(e) => onSortChange(e.target.value as GallerySortType)}
          className="text-xs rounded-none border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-white focus-visible:outline-none"
        >
          <option value="latest">最新</option>
          <option value="oldest">最早</option>
        </select>
        <span className="text-xs text-slate-500">{itemCount} 张图片</span>
      </div>
    </div>
  );
}

/**
 * 画廊面板组件.
 *
 * @param props 当前标签页、画廊数据和交互回调.
 * @returns 统一风格的右侧画廊容器.
 */
export function GalleryPanel({
  activeTab,
  showGallery,
  isGalleryMaximized,
  galleryViewMode,
  gallerySortType,
  gallerySearchQuery,
  imageGallery,
  videoGallery,
  musicGallery,
  generatedImageUrl,
  imagePrompt,
  editedImageUrl,
  imageEditPrompt,
  generatedVideoUrl,
  videoPrompt,
  generatedMusicUrl,
  musicPrompt,
  onToggleGallery,
  onToggleViewMode,
  onToggleMaximize,
  onClearGallery,
  onRemoveFromImageGallery,
  onRemoveFromVideoGallery,
  onRemoveFromMusicGallery,
  onPreviewImage,
  onDownloadImage,
  onSetSearchQuery,
  onSetSortType,
}: GalleryPanelProps) {
  const isImageTab = activeTab === "image" || activeTab === "image_edit";
  const isVideoTab = activeTab === "video";
  const isMusicTab = activeTab === "music";
  const isSubtitleTab = activeTab === "subtitle";

  // 获取当前画廊数据
  const currentGallery = isImageTab ? imageGallery : isVideoTab ? videoGallery : isSubtitleTab ? videoGallery : musicGallery;

  return (
    <div className={`border-l-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-900 transition-all duration-300 ease-in-out ${showGallery ? "w-80" : "w-0 overflow-hidden"} ${isGalleryMaximized ? "fixed inset-4 z-50 w-auto !top-[100px] border-4 border-slate-900 dark:border-white rounded-none shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]" : ""}`}>
      <div className="flex flex-col h-full">
        <GalleryHeader
          activeTab={activeTab}
          itemCount={currentGallery.length}
          viewMode={galleryViewMode}
          isMaximized={isGalleryMaximized}
          onToggleViewMode={onToggleViewMode}
          onToggleMaximize={onToggleMaximize}
          onClear={onClearGallery}
        />

        {isImageTab && currentGallery.length > 0 && (
          <GallerySearchBar
            searchQuery={gallerySearchQuery}
            sortType={gallerySortType}
            itemCount={currentGallery.length}
            onSearchChange={onSetSearchQuery}
            onSortChange={onSetSortType}
          />
        )}

        <ScrollArea className="flex-1">
          {(isImageTab || isVideoTab || isSubtitleTab) && (
            (() => {
              const isVideo = activeTab === "video" || activeTab === "subtitle";
              const currentItems: Array<{ id: string; url: string; prompt: string; timestamp: number; isCurrent: boolean }> = [];
              const historyItems: Array<{ id: string; url: string; prompt: string; timestamp: number; isCurrent: boolean }> = [];

              if (isVideo) {
                if (generatedVideoUrl) {
                  currentItems.push({ id: "current-video", url: generatedVideoUrl, prompt: videoPrompt, timestamp: 0, isCurrent: true });
                }
                historyItems.push(...videoGallery.map((vid) => ({ ...vid, isCurrent: false })));
              } else {
                if (generatedImageUrl) {
                  currentItems.push({ id: "current-generated", url: generatedImageUrl, prompt: imagePrompt, timestamp: 0, isCurrent: true });
                }
                if (editedImageUrl) {
                  currentItems.push({ id: "current-edited", url: editedImageUrl, prompt: imageEditPrompt, timestamp: 1, isCurrent: true });
                }
                historyItems.push(...imageGallery.map((img) => ({ ...img, isCurrent: false })));
              }

              return (
                <MediaGallery
                  currentItems={currentItems}
                  historyItems={historyItems}
                  viewMode={galleryViewMode}
                  isVideo={isVideo}
                  searchQuery={gallerySearchQuery}
                  sortType={gallerySortType}
                  onDelete={isVideo ? onRemoveFromVideoGallery : onRemoveFromImageGallery}
                  onPreview={onPreviewImage}
                  onDownload={onDownloadImage}
                />
              );
            })()
          )}

          {isMusicTab && (
            (() => {
              const currentMusic: Array<{ id: string; url: string; prompt: string; timestamp: number; isCurrent: boolean }> = [];
              if (generatedMusicUrl) {
                currentMusic.push({ id: "current-music", url: generatedMusicUrl, prompt: musicPrompt, timestamp: 0, isCurrent: true });
              }
              const historyMusic = musicGallery.map((m) => ({ ...m, isCurrent: false }));

              return (
                <MusicGallery
                  currentMusic={currentMusic}
                  historyMusic={historyMusic}
                  viewMode={galleryViewMode}
                  onDelete={onRemoveFromMusicGallery}
                />
              );
            })()
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
