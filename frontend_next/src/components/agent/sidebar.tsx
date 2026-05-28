/* eslint-disable */
/**
 * sidebar.tsx
 * 作者: wuhao
 * 日期: 2026-04-22
 * 描述: Agent 会话历史侧边栏, 类似 DeepSeek 布局
 * - Neo-Brutalism 风格
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAgentStore, SessionItem } from "@/stores/agent.store";
import { AgentAuthCorner } from "@/components/agent/agent_auth_corner";
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
    <div className="w-72 h-full bg-slate-50 dark:bg-slate-900 border-r-4 border-slate-900 dark:border-white flex flex-col transition-all duration-300">
      <div className="p-6 border-b-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-950">
        <Button 
          onClick={handleStartNew}
          className="w-full h-14 justify-start gap-4 shadow-[4px_4px_0px_0px_#0f172a] bg-white text-slate-900 border-4 border-slate-900 hover:bg-slate-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none rounded-none transition-all"
        >
          <div className="w-8 h-8 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center bg-slate-100">
            <Plus className="h-5 w-5 text-slate-900 font-black" />
          </div>
          <span className="font-black text-lg uppercase tracking-widest">新建对话</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-8">
          {groups.map(group => {
            const items = groupedSessions[group];
            if (!items || items.length === 0) return null;

            return (
              <div key={group} className="space-y-3">
                <h3 className="px-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2 border-l-4 border-cyan-500 pl-3">
                  <History className="h-5 w-5" />
                  {group}
                </h3>
                {items.map((session) => (
                  <div
                    key={session.session_id}
                    className={cn(
                      "group relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 border-2",
                      sessionId === session.session_id 
                        ? "bg-slate-100 text-slate-900 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a]" 
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-900 dark:hover:border-white hover:shadow-[4px_4px_0px_0px_#0f172a] dark:hover:shadow-[4px_4px_0px_0px_#ffffff]"
                    )}
                    onClick={() => editingId !== session.session_id && switchSession(session.session_id)}
                  >
                    <MessageSquare className="h-5 w-5 shrink-0" />
                    
                    {editingId === session.session_id ? (
                      <div className="flex-1 flex items-center gap-2 min-w-0" onClick={e => e.stopPropagation()}>
                        <Input
                          autoFocus
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleRename(session.session_id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-10 text-base font-bold px-2 min-w-0 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] focus-visible:ring-0 rounded-none text-slate-900"
                        />
                        <button onClick={() => handleRename(session.session_id)} className="p-2 border-2 border-slate-900 bg-slate-100 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-slate-50 text-slate-900">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 border-2 border-slate-900 bg-slate-100 shadow-[2px_2px_0px_0px_#0f172a] hover:bg-slate-50 text-slate-900">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="flex-1 text-base font-bold truncate pr-6">
                        {session.title || "新对话"}
                      </span>
                    )}

                    {!editingId && (
                      <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger onClick={e => e.stopPropagation()} className="p-1 border-2 border-transparent hover:border-slate-900 hover:bg-slate-100 hover:shadow-[2px_2px_0px_0px_#0f172a] transition-all text-slate-900">
                            <MoreVertical className="h-5 w-5 cursor-pointer" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0f172a] bg-white rounded-none p-0">
                            <DropdownMenuItem onClick={() => {
                              setEditingId(session.session_id);
                              setEditTitle(session.title || "");
                            }} className="p-3 font-bold text-slate-900 uppercase tracking-widest hover:bg-slate-100 cursor-pointer rounded-none border-b-2 border-slate-900">
                              <Edit2 className="h-5 w-5 mr-3" />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="p-3 font-bold text-slate-900 uppercase tracking-widest hover:bg-slate-100 cursor-pointer rounded-none"
                              onClick={() => deleteSession(session.session_id)}
                            >
                              <Trash2 className="h-5 w-5 mr-3" />
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
      <div className="p-4 border-t-4 border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-950">
        <AgentAuthCorner className="w-full" />
      </div>
    </div>
  );
}
