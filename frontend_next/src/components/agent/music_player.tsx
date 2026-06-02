/**
 * music_player.tsx
 * 作者: wuhao
 * 日期: 2026-06-01
 * 描述: 梦幻音乐播放器 - 支持歌词滚动、封面展示与专业播放控制
 */

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";

interface LyricLine {
  time: number;
  text: string;
}

interface MusicPlayerProps {
  url: string;
  title: string;
  coverUrl?: string | null;
  lyrics?: string | null;
  onClose?: () => void;
}

export function MusicPlayer({ url, title, coverUrl, lyrics, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const brutalBorder = "border-4 border-slate-900 dark:border-white";
  const brutalShadow = "shadow-[8px_8px_0px_0px_#0f172a] dark:shadow-[8px_8px_0px_0px_#ffffff]";

  // 解析 LRC 格式歌词
  const parsedLyrics = useMemo(() => {
    if (!lyrics) return [];
    const lines = lyrics.split("\n");
    const result: LyricLine[] = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    lines.forEach(line => {
      const match = timeReg.exec(line);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = parseInt(match[3]);
        const time = minutes * 60 + seconds + (ms > 99 ? ms / 1000 : ms / 100);
        const text = line.replace(timeReg, "").trim();
        if (text) result.push({ time, text });
      } else if (line.trim() && !line.startsWith("[")) {
        // 处理无时间戳的歌词
        result.push({ time: -1, text: line.trim() });
      }
    });
    return result;
  }, [lyrics]);

  // 获取当前活跃歌词索引
  const activeIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentTime, parsedLyrics]);

  // 自动滚动歌词
  useEffect(() => {
    if (activeIndex !== -1 && scrollRef.current) {
      const activeElement = scrollRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeIndex]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-slate-950 transition-all duration-300",
      isMaximized ? "fixed inset-4 z-50 rounded-none" : "relative w-full h-full rounded-none",
      brutalBorder,
      brutalShadow
    )}>
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between p-4 border-b-4 border-slate-900 dark:border-white bg-cyan-500">
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-slate-900" />
          <span className="font-black uppercase tracking-tighter text-slate-900 truncate max-w-[200px]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-white/20 transition-colors"
          >
            {isMaximized ? <Minimize2 className="h-5 w-5 text-slate-900" /> : <Maximize2 className="h-5 w-5 text-slate-900" />}
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="font-black text-2xl leading-none hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 主体内容区 */}
      <div className={cn(
        "flex flex-col md:flex-row flex-1 overflow-hidden",
        isMaximized ? "p-8 gap-8" : "p-4 gap-4"
      )}>
        {/* 左侧：封面图 */}
        <div className={cn(
          "flex-shrink-0 flex items-center justify-center",
          isMaximized ? "w-full md:w-1/2" : "w-full md:w-48"
        )}>
          <div className={cn(
            "relative aspect-square w-full max-w-[400px] overflow-hidden group cursor-pointer",
            brutalBorder,
            brutalShadow
          )}>
            {coverUrl ? (
              <img 
                src={coverUrl} 
                alt={title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <Music className="h-24 w-24 text-slate-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-black uppercase text-xs tracking-widest bg-slate-900 px-3 py-1">点击查看大图</span>
            </div>
          </div>
        </div>

        {/* 右侧：歌词区 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className={cn(
            "flex-1 bg-slate-50 dark:bg-slate-900/50 overflow-hidden relative",
            brutalBorder
          )}>
            <div 
              ref={scrollRef}
              className="h-full overflow-y-auto p-6 scroll-smooth"
            >
              {parsedLyrics.length > 0 ? (
                <div className="space-y-6 py-20">
                  {parsedLyrics.map((line, idx) => (
                    <p
                      key={idx}
                      data-index={idx}
                      className={cn(
                        "text-lg md:text-xl font-black transition-all duration-300 text-center leading-relaxed",
                        activeIndex === idx 
                          ? "text-cyan-600 dark:text-cyan-400 scale-110 translate-x-2" 
                          : "text-slate-400 dark:text-slate-600 opacity-50"
                      )}
                    >
                      {line.text}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <Music className="h-12 w-12 mb-4" />
                  <p className="font-black uppercase tracking-widest">暂无歌词数据</p>
                </div>
              )}
            </div>
            {/* 渐变遮罩 */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-50 dark:from-slate-900 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 dark:from-slate-900 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="p-6 border-t-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-900">
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
        
        {/* 进度条 */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-xs font-black w-10">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleProgressChange}
            className="flex-1 h-3 bg-slate-300 dark:bg-slate-700 appearance-none cursor-pointer accent-cyan-500 border-2 border-slate-900 dark:border-white"
          />
          <span className="text-xs font-black w-10">{formatTime(duration)}</span>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="text-slate-900 dark:text-white hover:text-cyan-500 transition-colors">
              <SkipBack className="h-6 w-6" />
            </button>
            <button
              onClick={togglePlay}
              className={cn(
                "w-14 h-14 flex items-center justify-center transition-all",
                brutalBorder,
                brutalShadow,
                "bg-cyan-500 hover:bg-cyan-400 text-slate-900 active:translate-x-1 active:translate-y-1 active:shadow-none"
              )}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </button>
            <button className="text-slate-900 dark:text-white hover:text-cyan-500 transition-colors">
              <SkipForward className="h-6 w-6" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              className="w-24 h-2 bg-slate-300 dark:bg-slate-700 appearance-none cursor-pointer accent-slate-900 dark:accent-white border-2 border-slate-900 dark:border-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
