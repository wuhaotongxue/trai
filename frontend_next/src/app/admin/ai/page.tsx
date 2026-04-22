/**
 * page.tsx
 * AI 内容管理页面
 */

"use client";

import { useState, useEffect } from "react";
import { Bot, Image as ImageIcon, Video, Music, Settings, Activity, Power, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { request } from "@/lib/api_client";
import { useToast } from "@/components/toast/use_toast";

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  api_base: string | null;
  is_active: boolean;
}

interface AIStats {
  chat_count: number;
  image_count: number;
  video_count: number;
  audio_count: number;
}

export default function AIManagementPage() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        request<AIStats>("/admin/ai/stats"),
        request<ModelConfig[]>("/admin/ai/models"),
      ]);
      setStats(s);
      setModels(m);
    } catch (e) {
      console.error("Fetch AI data failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await request(`/admin/ai/models/${id}/toggle`, { method: "POST" });
      toast({ message: "模型状态已更新", variant: "success" });
      fetchData();
    } catch (e: any) {
      toast({ message: e.message || "更新失败", variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI 内容管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">管理对话、绘图、视频等模型配置与使用情况</p>
        </div>
        <Button size="sm" variant="outline" className="h-9 gap-2 text-sm border-border" onClick={fetchData}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* 使用统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "对话总数", value: stats?.chat_count || 0, icon: Bot, color: "text-blue-400" },
          { label: "绘图生成", value: stats?.image_count || 0, icon: ImageIcon, color: "text-emerald-400" },
          { label: "视频合成", value: stats?.video_count || 0, icon: Video, color: "text-orange-400" },
          { label: "音频处理", value: stats?.audio_count || 0, icon: Music, color: "text-purple-400" },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{item.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 模型列表 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">模型节点配置</CardTitle>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Settings className="h-3.5 w-3.5" />
            配置渠道
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {models.map((m) => (
              <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/10 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.is_active ? "bg-blue-500/10" : "bg-muted"}`}>
                  <Activity className={`h-5 w-5 ${m.is_active ? "text-blue-500" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{m.name}</p>
                    <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground font-mono">{m.provider}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{m.api_base || "内部集成"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={m.is_active ? "outline" : "default"}
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => handleToggle(m.id)}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {m.is_active ? "禁用" : "开启"}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 文生图 / 文生视频 快捷配置 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              绘图能力配置 (Stable Diffusion / MJ)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-xs">默认绘图模型</span>
              <span className="text-xs font-medium">ModelScope / Flux.1</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-xs">最大并发任务</span>
              <span className="text-xs font-medium">5</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Video className="h-4 w-4 text-orange-500" />
              多媒体能力配置 (Video / Music)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-xs">视频生成提供商</span>
              <span className="text-xs font-medium">Luma AI</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-xs">音乐生成引擎</span>
              <span className="text-xs font-medium">Suno V3.5</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
