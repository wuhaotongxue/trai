/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-04-21 10:15:00
 * 描述: 管理后台 - 组织架构管理
 */

"use client";

import React from "react";
import { Users, Plus, Building2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OrganizationPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">组织架构</h1>
          <p className="text-sm text-muted-foreground mt-1">管理企业部门、团队及成员结构</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="h-9 gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            新建部门
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" />
              部门列表
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索部门或成员..." className="pl-9 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-12 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm">组织架构模块正在建设中，敬请期待...</p>
        </CardContent>
      </Card>
    </div>
  );
}
