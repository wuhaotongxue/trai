# Desktop_Client_PyQt6_规范

---

## 1. 中文标点禁令

<div style="background:#FFF4F4;border:1px solid #FFB4B4;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#D32F2F;">&#x274C; 绝对禁止</strong> — 代码、注释、UI 文案中严禁出现中文全角标点
  <div style="margin-top:8px;font-size:13px;">
    <span style="color:#D32F2F;">&#x2718;</span> <code style="color:#D32F2F;">，。！？：</code>
    &nbsp;&nbsp;
    <span style="color:#2E7D32;">&#x2714;</span> <code style="color:#2E7D32;">, . ! ? :</code>
  </div>
</div>

---

## 2. 信号槽规范

### 声明位置

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 类级别声明</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      <code>sig_success = pyqtSignal(dict)</code>
    </div>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 方法内部动态创建</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      禁止在 run() 中创建信号
    </div>
  </div>
</div>

### 连接方式

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; Lambda 或 bound method</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      <code>worker.sig_success.connect(lambda d: self._on_success(d))</code>
    </div>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 闭包陷阱</strong>
    <div style="margin-top:8px;font-size:13px;color:#555;">
      <code>lambda: self._on_success(data)</code> 会导致引用问题
    </div>
  </div>
</div>

---

## 3. QThreadPool 使用规范

**约束**：
- 使用全局线程池 `QThreadPool.globalInstance()`
- 必须设置最大线程数 `setMaxThreadCount(4)`
- 必须设置超时 `waitForDone(5000)`

---

## 4. QTimer 使用规范

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 正确做法</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>在 __init__ 中创建定时器</li>
      <li>在 closeEvent 中调用 <code>timer.stop()</code></li>
    </ul>
  </div>
  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 错误做法</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>closeEvent 中不停止定时器</li>
      <li>定时器仍在后台运行</li>
    </ul>
  </div>
</div>

---

## 5. 禁止事项汇总

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">

  <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;">
    <strong style="color:#C62828;">&#x274C; 严禁事项</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>在 slot 中写网络请求</li>
      <li>跨线程操作 UI</li>
      <li>动态创建信号</li>
      <li>模块顶层 import 重型依赖</li>
      <li>硬编码路径</li>
      <li>print 日志</li>
      <li>裸 except</li>
      <li>不停止 QTimer</li>
      <li>不等待线程退出</li>
    </ul>
  </div>

  <div style="background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:12px;">
    <strong style="color:#2E7D32;">&#x2714; 正确做法</strong>
    <ul style="margin:8px 0 0 0;padding-left:16px;font-size:13px;color:#555;">
      <li>QRunnable + QThreadPool</li>
      <li>pyqtSignal 跨线程通信</li>
      <li>类级别声明 pyqtSignal</li>
      <li>懒加载重型依赖</li>
      <li>pathlib.Path</li>
      <li>logger</li>
      <li>指明异常类型 + logger.error</li>
      <li>closeEvent 中 timer.stop()</li>
      <li>thread.wait(timeout)</li>
    </ul>
  </div>

</div>

---

## 6. 路径规范

<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px 16px;margin:12px 0;">
  <strong style="color:#C62828;">&#x274C; 禁止硬编码路径</strong>
  <div style="margin-top:8px;font-size:13px;color:#555;">
    必须使用 <code>pathlib.Path</code>
  </div>
</div>

---

## 7. 快速参考

<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px;background:#F9F9F9;border-radius:12px;margin:12px 0;">

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止跨线程操作 UI</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须通过 pyqtSignal</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止中文标点</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">全角逗号句号感叹号</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#D32F2F;">禁止裸 except</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">必须指明异常类型</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">QThreadPool</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">QRunnable 标准实现</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">closeEvent</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">stop/quit/wait/deleteLater</div>
  </div>

  <div style="background:white;border:1px solid #E1E1E1;border-radius:8px;padding:12px;text-align:center;">
    <strong style="font-size:13px;color:#1565C0;">pathlib</strong>
    <div style="font-size:12px;color:#666;margin-top:4px;">禁止硬编码路径</div>
  </div>

</div>