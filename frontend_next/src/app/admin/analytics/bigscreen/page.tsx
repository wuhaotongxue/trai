"use client";

import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Users, Building2, TrendingUp, TrendingDown, Maximize2, Minimize2 } from "lucide-react";
import { request } from "@/lib/api_client";

const MAX_DEPT_DISPLAY = 8;

interface DeptStat {
  dept_name: string;
  user_count: number;
}

interface WeeklyTrend {
  week: string;
  hires: number;
  resignations: number;
}

interface AnalyticsData {
  total_users: number;
  dept_stats: DeptStat[];
  weekly_trend: WeeklyTrend[];
}

export default function BigScreenAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await request<AnalyticsData>("/admin/analytics/wecom");
        setData(res);
      } catch (e) {
        console.error("Fetch analytics failed", e);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-screen bg-[#0b0f1a] text-white">Loading...</div>;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const displayDepts = data.dept_stats.slice(0, MAX_DEPT_DISPLAY);
  const deptOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Department Distribution',
      left: 'center',
      textStyle: { color: '#fff', fontSize: 14 }
    },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#0b0f1a', borderWidth: 2 },
        label: {
          show: true,
          color: '#ccc',
          formatter: '{b}: {c}'
        },
        data: displayDepts.map((d) => ({ value: d.user_count, name: d.dept_name }))
      }
    ]
  };


  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['Hired', 'Resigned'], textStyle: { color: '#ccc' }, bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.weekly_trend.map((w) => w.week).reverse(),
      axisLabel: { color: '#666' }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#222' } }, axisLabel: { color: '#666' } },
    series: [
      {
        name: 'Hired',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#10b981' },
        data: data.weekly_trend.map((w) => w.hires).reverse()
      },
      {
        name: 'Resigned',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.1 },
        itemStyle: { color: '#ef4444' },
        data: data.weekly_trend.map((w) => w.resignations).reverse()
      }
    ]
  };

  return (
    <div className={`min-h-screen bg-[#0b0f1a] text-white p-6 font-sans overflow-hidden ${isFullscreen ? 'p-10' : ''}`}>
      <div className="flex items-center justify-between mb-6 border-b border-blue-500/30 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-none-none flex items-center justify-center shadow-[6px_6px_0px_0px_#0f172a] dark:shadow-[6px_6px_0px_0px_#ffffff] shadow-blue-600/20">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-widest bg-slate-100 bg-clip-text text-transparent">
              TRAI Organization Analytics
            </h1>
            <p className="text-blue-400/60 text-xs mt-1">REAL-TIME DATA ANALYTICS CENTER</p>
          </div>
        </div>
        <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-none-none transition-colors">
          {isFullscreen ? <Minimize2 className="h-6 w-6 text-blue-400" /> : <Maximize2 className="h-6 w-6 text-blue-400" />}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        <div className="col-span-12 lg:col-span-3 space-y-4 overflow-hidden">
          <div className="bg-white/5 border border-white/10 rounded-none-none p-4 ">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-none">LIVE</span>
            </div>
            <p className="text-xs text-gray-400">Total Users</p>
            <p className="text-4xl font-mono font-bold text-white">{data.total_users}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-none-none p-4 ">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-none">WEEKLY</span>
            </div>
            <p className="text-xs text-gray-400">New Hires</p>
            <p className="text-4xl font-mono font-bold text-white">
              {data.weekly_trend[0]?.hires || 0}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-none-none p-4 ">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-red-400" />
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-none">WEEKLY</span>
            </div>
            <p className="text-xs text-gray-400">Resigned</p>
            <p className="text-4xl font-mono font-bold text-white">
              {data.weekly_trend[0]?.resignations || 0}
            </p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white/5 border border-white/10 rounded-none-none p-4 ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-none-none" />
              Hire/Resign Trend
            </h3>
          </div>
          <div className="h-[calc(100%-40px)]">
            <ReactECharts option={trendOption} style={{ height: '100%' }} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white/5 border border-white/10 rounded-none-none p-4 ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-200 rounded-none-none" />
              Dept Distribution (Top {MAX_DEPT_DISPLAY})
            </h3>
          </div>
          <div className="h-[calc(100%-40px)]">
            <ReactECharts option={deptOption} style={{ height: '100%' }} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-[10px] text-gray-500 uppercase tracking-widest">
        <p>2026 TRAI INTELLIGENT SYSTEMS</p>
        <p>STATUS: OPTIMAL | ENCRYPTION: AES-256</p>
      </div>
    </div>
  );
}
