# Frontend Next.js - Monitor 大屏展示规范

---

## 1. 路由位置

```
src/app/[locale]/dashboard/monitor/page.tsx
```

---

## 2. 布局结构

```tsx
export default function MonitorPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* 全屏控制 */}
      <FullscreenButton />

      {/* 顶部标题栏 */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-center">
        <h1 className="text-xl font-bold">TRAI 数据监控中心</h1>
        <span className="ml-4 text-sm text-slate-400">
          {new Date().toLocaleString()}
        </span>
      </header>

      {/* 主内容: 三栏布局 */}
      <main className="grid grid-cols-12 gap-4 p-4">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </main>

      {/* 底部图表 */}
      <footer className="border-t border-slate-800 p-4">
        <BottomCharts />
      </footer>
    </div>
  );
}
```

---

## 3. 三栏布局

```tsx
<div className="grid grid-cols-12 gap-4">
  {/* 左侧 3 列: 统计卡片 */}
  <div className="col-span-3 space-y-4">
    <StatCard title="总用户" value="10,000+" />
    <StatCard title="活跃任务" value="143" />
    <StatCard title="Token 消耗" value="1.2M" />
    <StatCard title="服务可用性" value="99.9%" />
  </div>

  {/* 中间 6 列: 主图表 */}
  <div className="col-span-6 space-y-4">
    <MainChart />
    <TrendChart />
  </div>

  {/* 右侧 3 列: 排行榜 */}
  <div className="col-span-3 space-y-4">
    <RankingList />
    <ActivityFeed />
  </div>
</div>
```

---

## 4. 深色主题配色

```tsx
// 深色主题
<div className="bg-slate-950 text-white">
```

| 用途 | 颜色 | Tailwind |
|------|------|----------|
| 背景 | #020617 | bg-slate-950 |
| 卡片 | #1e293b | bg-slate-800 |
| 边框 | #334155 | border-slate-700 |
| 主色 | #3b82f6 | text-blue-500 |
| 成功 | #22c55e | text-green-500 |
| 警告 | #f59e0b | text-amber-500 |
| 错误 | #ef4444 | text-red-500 |
| 文字 | #f8fafc | text-slate-50 |
| 次要文字 | #94a3b8 | text-slate-400 |

---

## 5. 统计卡片

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaUp?: boolean;
  icon: LucideIcon;
}

export function StatCard({ title, value, delta, deltaUp, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {delta && (
        <div className={`text-sm ${deltaUp ? "text-green-500" : "text-red-500"}`}>
          {delta} vs 上周
        </div>
      )}
    </div>
  );
}
```

---

## 6. 图表组件

### 6.1 折线图 (趋势)

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="time" stroke="#64748b" />
    <YAxis stroke="#64748b" />
    <Tooltip
      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
    />
    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

### 6.2 饼图 (占比)

```tsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

<PieChart>
  <Pie
    data={data}
    cx="50%"
    cy="50%"
    innerRadius={60}
    outerRadius={80}
    dataKey="value"
  >
    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
  </Pie>
  <Tooltip />
</PieChart>
```

### 6.3 柱状图 (对比)

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={200}>
  <BarChart data={data}>
    <XAxis dataKey="name" stroke="#64748b" />
    <YAxis stroke="#64748b" />
    <Tooltip contentStyle={{ backgroundColor: "#1e293b" }} />
    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## 7. 实时数据

### 7.1 WebSocket

```tsx
// hooks/use-realtime-stats.ts
export function useRealtimeStats() {
  const [stats, setStats] = useState<Stats>(initialStats);

  useEffect(() => {
    const ws = new WebSocket("wss://api.example.com/stats/realtime");

    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStats((prev) => ({ ...prev, ...data }));
    };
    ws.onerror = (error) => console.error("WebSocket error", error);
    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, []);

  return stats;
}
```

### 7.2 定时刷新

```tsx
// 备用: HTTP 轮询
const { data } = useQuery({
  queryKey: ["stats"],
  queryFn: () => api.get("/stats"),
  refetchInterval: 30000, // 30 秒刷新
});
```

---

## 8. 全屏模式

```tsx
const [fullscreen, setFullscreen] = useState(false);

useEffect(() => {
  const onFsChange = () => setFullscreen(!!document.fullscreenElement);
  document.addEventListener("fullscreenchange", onFsChange);
  return () => document.removeEventListener("fullscreenchange", onFsChange);
}, []);

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
};

<Button
  onClick={toggleFullscreen}
  className="fixed bottom-6 right-6 z-50"
>
  {fullscreen ? <Minimize2 /> : <Maximize2 />}
  {fullscreen ? "退出全屏" : "全屏"}
</Button>
```

---

## 9. 数据刷新策略

| 数据类型 | 刷新频率 | 方式 |
|---------|---------|------|
| 实时流量 | 实时 | WebSocket |
| 在线人数 | 5 秒 | WebSocket |
| 任务统计 | 30 秒 | HTTP 轮询 |
| 日报表 | 5 分钟 | HTTP 轮询 |
| 月报表 | 手动刷新 | HTTP |

---

## 10. 动画效果

```tsx
// 数字滚动动画
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  // 数值递增动画
  return <span>{display.toLocaleString()}</span>;
};

// 闪烁动画 (有新数据时)
<div className="animate-pulse">
  {/* 有新数据时闪烁 */}
</div>
```

---

## 11. 禁止事项

- 数据超过 30 秒未刷新
- 深色主题使用浅色文字 (#fff on #fff)
- 图表无数据时显示错误
- 移动端不兼容 (大屏通常全屏展示)
- 全屏模式不支持
- 无加载/错误状态
- 大量数据导致卡顿
