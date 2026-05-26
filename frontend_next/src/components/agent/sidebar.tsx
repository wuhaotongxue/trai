/* eslint-disable */
/**
 * sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-22
 * 描述: Agent 会话历史侧边栏, 类似 DeepSeek 布局
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAgentStore, SessionItem } from "@/stores/agent.store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll_area";
import { 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  History,
  Captions
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown_menu";
import { Input } from "@/components/ui/input";

export function Sidebar() {
  const { 
    sessions, 
    sessionId, 
    loadSessions, 
    startSession, 
    switchSession, 
    deleteSession, 
    renameSession 
  } = useAgentStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    await renameSession(id, editTitle.trim());
    setEditingId(null);
  };

  const handleStartNew = async () => {
    await startSession();
  };

  // 按日期分组（过滤掉空会话）
  const groupedSessions = sessions
    .filter((s) => s.message_count > 0)
    .reduce((acc, session) => {
    const date = new Date(session.updated_at || session.created_at || Date.now());
    const now = new Date();
    let group = "更早以前";

    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) group = "今天";
    else if (diffDays === 1) group = "昨天";
    else if (diffDays < 7) group = "最近 7 天";
    else if (diffDays < 30) group = "最近 30 天";

    if (!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, SessionItem[]>);

  const groups = ["今天", "昨天", "最近 7 天", "最近 30 天", "更早以前"];

  return (
    <div className="w-64 h-full bg-slate-50 dark:bg-[#0d1220] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300">
      <div className="p-4">
        <Button 
          onClick={handleStartNew}
          className="w-full justify-start gap-2 shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl py-6"
          variant="outline"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Plus className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-semibold">新建对话</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 pb-4">
        <div className="space-y-6">
          {groups.map(group => {
            const items = groupedSessions[group];
            if (!items || items.length === 0) return null;

            return (
              <div key={group} className="space-y-1">
                <h3 className="px-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <History className="h-3 w-3" />
                  {group}
                </h3>
                {items.map((session) => (
                  <div
                    key={session.session_id}
                    className={cn(
                      "group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200",
                      sessionId === session.session_id 
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    )}
                    onClick={() => editingId !== session.session_id && switchSession(session.session_id)}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                    
                    {editingId === session.session_id ? (
                      <div className="flex-1 flex items-center gap-1 min-w-0" onClick={e => e.stopPropagation()}>
                        <Input
                          autoFocus
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleRename(session.session_id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-7 text-xs px-1.5 py-0 min-w-0 bg-white dark:bg-slate-900"
                        />
                        <button onClick={() => handleRename(session.session_id)} className="p-1 hover:text-green-500">
                          <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="flex-1 text-sm truncate pr-6">
                        {session.title || "新对话"}
                      </span>
                    )}

                    {!editingId && (
                      <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                      <DropdownMenuTrigger onClick={e => e.stopPropagation()}>
                        <MoreVertical className="h-3.5 w-3.5 cursor-pointer hover:text-blue-500" />
                      </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => {
                              setEditingId(session.session_id);
                              setEditTitle(session.title || "");
                            }}>
                              <Edit2 className="h-3.5 w-3.5 mr-2" />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500 focus:text-red-500"
                              onClick={() => deleteSession(session.session_id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
