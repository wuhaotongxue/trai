/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-21 10:15:00
 * 描述: 管理后台 - 客户端发布
 */

"use client";

import React from "react";
import { Cpu, Plus, Download, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClientReleasePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">客户端发布</h1>
          <p className="text-sm text-muted-foreground mt-1">管理桌面客户端和移动端的版本更新与下发</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-9 gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            发布新版本
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-500" />
              版本列表
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索版本号..." className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-12 text-center text-muted-foreground">
          <Download className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm">版本发布模块正在建设中，敬请期待...</p>
        </CardContent>
      </Card>
    </div>
  );
}
