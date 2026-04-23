"use client";

import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Users, Building2, TrendingUp, TrendingDown, Maximize2, Minimize2 } from "lucide-react";
import { request } from "@/lib/api_client";

export default function BigScreenAnalytics() {
  const [data, setData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await request<any>("/admin/analytics/wecom");
        setData(res);
      } catch (e) {
        console.error("Fetch analytics failed", e);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 60000); // 1分钟刷新一次
    return () => clearInterval(timer);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-screen bg-[#0b0f1a] text-white">正在加载数字化大屏...</div>;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 部门分布饼图
  const deptOption = {
    backgroundColor: 'transparent',
    title: { text: '部门人员分布', left: 'center', textStyle: { color: '#fff', fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#0b0f1a', borderWidth: 2 },
        label: { show: true, color: '#ccc' },
        data: data.dept_stats.map((d: any) => ({ value: d.user_count, name: d.dept_name }))
      }
    ]
  };

  // 入离职趋势图
  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['入职', '离职'], textStyle: { color: '#ccc' }, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.weekly_trend.map((w: any) => w.week).reverse(),
      axisLabel: { color: '#666' }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#222' } }, axisLabel: { color: '#666' } },
    series: [
      {
        name: '入职',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#10b981' },
        data: data.weekly_trend.map((w: any) => w.hires).reverse()
      },
      {
        name: '离职',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#ef4444' },
        data: data.weekly_trend.map((w: any) => w.resignations).reverse()
      }
    ]
  };

  return (
    <div className={`min-h-screen bg-[#0b0f1a] text-white p-6 font-sans ${isFullscreen ? 'p-10' : ''}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8 border-b border-blue-500/30 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-widest bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              TRAI 组织架构数字化大屏
            </h1>
            <p className="text-blue-400/60 text-xs mt-1">REAL-TIME ORGANIZATION DATA ANALYTICS CENTER</p>
          </div>
        </div>
        <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          {isFullscreen ? <Minimize2 className="h-6 w-6 text-blue-400" /> : <Maximize2 className="h-6 w-6 text-blue-400" />}
        </button>
      </div>

      {/* 主体内容 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 左侧指标 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-6 w-6 text-blue-400" />
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">LIVE</span>
            </div>
            <p className="text-sm text-gray-400">当前总人数</p>
            <p className="text-5xl font-mono font-bold mt-2 text-white">{data.total_users}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">WEEKLY</span>
            </div>
            <p className="text-sm text-gray-400">本周新入职</p>
            <p className="text-5xl font-mono font-bold mt-2 text-white">
              {data.weekly_trend[0]?.hires || 0}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="h-6 w-6 text-red-400" />
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">WEEKLY</span>
            </div>
            <p className="text-sm text-gray-400">本周已离职</p>
            <p className="text-5xl font-mono font-bold mt-2 text-white">
              {data.weekly_trend[0]?.resignations || 0}
            </p>
          </div>
        </div>

        {/* 中间图表 */}
        <div className="col-span-12 lg:col-span-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-full" />
              入离职趋势分析
            </h3>
          </div>
          <div className="h-[500px]">
            <ReactECharts option={trendOption} style={{ height: '100%' }} />
          </div>
        </div>

        {/* 右侧分布 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-1 h-5 bg-cyan-500 rounded-full" />
                部门人力占比
              </h3>
            </div>
            <div className="h-[500px]">
              <ReactECharts option={deptOption} style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="mt-8 flex justify-between text-[10px] text-gray-500 uppercase tracking-widest">
        <p>© 2026 TRAI INTELLIGENT SYSTEMS · DATA CENTER</p>
        <p>SYSTEM STATUS: OPTIMAL · ENCRYPTION: AES-256 · NODE: SHANGHAI-01</p>
      </div>
    </div>
  );
}
