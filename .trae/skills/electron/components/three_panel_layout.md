# ThreePanelLayout 三段式布局组件

## 1. 组件介绍

ThreePanelLayout 是 TRAI 客户端的核心布局组件，实现了左侧面板 + 中间面板 + 右侧内容区的三段式布局。该组件提供了响应式设计，支持面板的展开/折叠动画，适用于各种复杂页面的布局需求。

## 2. 组件接口

```tsx
interface ThreePanelLayoutProps {
  title: string;                             // 页面标题
  titleIcon?: React.ReactNode;               // 标题图标
  leftPanelTitle?: string;                   // 左侧面板标题
  leftPanel?: React.ReactNode;               // 左侧面板内容
  leftPanelDefaultOpen?: boolean;            // 左侧面板默认是否打开
  middlePanelTitle?: string;                 // 中间面板标题
  middlePanel?: React.ReactNode;             // 中间面板内容
  middlePanelDefaultOpen?: boolean;          // 中间面板默认是否打开
  rightPanelTitle?: string;                  // 右侧面板标题
  rightPanel?: React.ReactNode;              // 右侧面板内容
  rightPanelDefaultOpen?: boolean;           // 右侧面板默认是否打开
  titleExtra?: React.ReactNode;              // 标题栏右侧额外内容
  contentPadding?: string | number;          // 内容区 padding
  children: React.ReactNode;                 // 主内容区域
}
```

## 3. 基本用法

### 3.1 最小化使用（仅左侧面板）

```tsx
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'
import { Home } from 'lucide-react'

const MyPage: React.FC = () => {
  // 左侧面板内容
  const left_panel = (
    <div style={{ padding: '16px' }}>
      <h4>导航菜单</h4>
      <ul>
        <li>首页</li>
        <li>设置</li>
        <li>帮助</li>
      </ul>
    </div>
  )

  return (
    <ThreePanelLayout
      title="我的页面"
      titleIcon={<Home size={20} />}
      leftPanelTitle="导航"
      leftPanel={left_panel}
      leftPanelDefaultOpen={true}
    >
      <div style={{ padding: '20px' }}>
        <h1>主内容区域</h1>
        <p>这里是页面的主要内容</p>
      </div>
    </ThreePanelLayout>
  )
}
```

### 3.2 完整三段式布局

```tsx
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'
import { Settings } from 'lucide-react'

const MyComplexPage: React.FC = () => {
  // 左侧面板
  const left_panel = (
    <div style={{ padding: '16px' }}>
      <h4>主菜单</h4>
      {/* 主导航菜单 */}
    </div>
  )

  // 中间面板
  const middle_panel = (
    <div style={{ padding: '16px' }}>
      <h4>子菜单</h4>
      {/* 子导航菜单 */}
    </div>
  )

  return (
    <ThreePanelLayout
      title="复杂页面"
      titleIcon={<Settings size={20} />}
      leftPanelTitle="主导航"
      leftPanel={left_panel}
      leftPanelDefaultOpen={true}
      middlePanelTitle="子导航"
      middlePanel={middle_panel}
      middlePanelDefaultOpen={true}
    >
      <div style={{ padding: '20px' }}>
        <h1>详细内容</h1>
        <p>这里是页面的详细内容</p>
      </div>
    </ThreePanelLayout>
  )
}
```

## 4. 特性说明

### 4.1 面板控制
- **自动折叠/展开**：点击面板标题旁的箭头图标可切换面板状态
- **动画效果**：面板切换时带有平滑的过渡动画
- **响应式调整**：面板宽度会根据内容自动调整

### 4.2 样式特性
- **主题适配**：自动适配亮色/暗色主题
- **拖拽区域**：标题栏支持窗口拖拽（仅 Electron 环境）
- **分隔线**：面板之间有清晰的分隔线

### 4.3 布局特性
- **高度自适应**：组件会自动适应父容器高度
- **滚动处理**：内容区域自动处理溢出滚动
- **灵活配置**：可根据需要配置不同组合的面板

## 5. 最佳实践

### 5.1 适用场景
- **管理后台**：左侧导航 + 中间筛选 + 右侧内容
- **媒体播放器**：左侧文件列表 + 右侧播放区域
- **数据可视化**：左侧控制 + 右侧图表

### 5.2 性能优化
- **懒加载**：面板内容可使用 React.lazy 进行懒加载
- **虚拟滚动**：长列表使用 react-window 等库优化性能
- **缓存策略**：对于频繁切换的面板内容考虑使用缓存

### 5.3 代码组织
- **组件化**：将面板内容拆分为独立组件
- **状态管理**：使用 useContext 或状态管理库管理跨面板状态
- **类型定义**：为面板内容定义明确的 TypeScript 接口

## 6. 注意事项

1. **面板宽度**：左侧面板默认最小宽度 140px，中间面板默认最小宽度 200px
2. **内容溢出**：确保面板内容不会导致布局错乱，合理使用 overflow
3. **性能考虑**：避免在面板中放置过于复杂的组件，影响展开/折叠动画性能
4. **主题一致性**：使用 var(--ui_*) 变量确保与应用主题保持一致
5. **响应式设计**：在小屏幕设备上可能需要调整布局策略

## 7. 常见问题

### 7.1 面板无法展开/折叠
- 检查是否正确传递了 leftPanel、middlePanel 等 props
- 确保面板内容没有导致布局错误

### 7.2 动画不流畅
- 减少面板内容的复杂度
- 避免在动画过程中进行重渲染
- 考虑使用 React.memo 优化组件

### 7.3 样式冲突
- 避免在面板内容中使用全局样式
- 使用 CSS Modules 或 styled-components 进行样式隔离

## 8. 示例应用

### 8.1 媒体播放器

```tsx
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'
import { Music } from 'lucide-react'

const MediaPlayer: React.FC = () => {
  const left_panel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 文件列表 */}
    </div>
  )

  return (
    <ThreePanelLayout
      title="媒体播放器"
      titleIcon={<Music size={20} />}
      leftPanelTitle="媒体文件"
      leftPanel={left_panel}
      leftPanelDefaultOpen={true}
      contentPadding={0}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 播放区域 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--ui_panel_alt)' }}>
          {/* 播放器内容 */}
        </div>
        
        {/* 控制栏 */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--ui_border)', backgroundColor: 'var(--ui_panel)' }}>
          {/* 控制按钮 */}
        </div>
      </div>
    </ThreePanelLayout>
  )
}
```

### 8.2 媒体处理页面

```tsx
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'
import { FileText } from 'lucide-react'

const MediaProcessor: React.FC = () => {
  const left_panel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 任务列表 */}
    </div>
  )

  return (
    <ThreePanelLayout
      title="媒体处理"
      titleIcon={<FileText size={20} />}
      leftPanelTitle="处理任务"
      leftPanel={left_panel}
      leftPanelDefaultOpen={true}
      contentPadding={0}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 标签栏 */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ui_border)', backgroundColor: 'var(--ui_panel)' }}>
          {/* 标签按钮 */}
        </div>
        
        {/* 内容区域 */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {/* 标签页内容 */}
        </div>
      </div>
    </ThreePanelLayout>
  )
}
```

## 9. 总结

ThreePanelLayout 组件是 TRAI 客户端的核心布局解决方案，提供了灵活、美观、响应式的三段式布局能力。通过合理配置组件 props，可以快速构建各种复杂页面，提升开发效率和用户体验。

建议在所有需要多面板布局的页面中使用此组件，确保应用界面的一致性和专业性。