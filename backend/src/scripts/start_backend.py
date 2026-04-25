#!/usr/bin/env python
"""
start_backend.py
作者: wuhao
日期: 2026-04-25
描述: 启动后端服务，自动清理占用端口的僵尸进程
功能:
- 检查端口占用情况
- 清理 Windows/Linux 上的僵尸进程
- 启动后端服务
"""

import os
import sys
import signal
import subprocess
import time
from datetime import datetime
from pathlib import Path

# 默认端口
DEFAULT_PORT = 5666

def get_configured_port() -> int:
    """从 .env 文件读取配置的端口"""
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                if key.strip() in ("BACKEND_PORT", "PORT", "API_PORT"):
                    try:
                        return int(value.strip())
                    except ValueError:
                        pass
    return DEFAULT_PORT

def find_process_on_port(port: int) -> list[dict]:
    """Find processes listening on the specified port"""
    processes = []
    
    if sys.platform == "win32":
        # Windows: use netstat to find processes on port
        try:
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            for line in result.stdout.splitlines():
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        try:
                            pid_int = int(pid)
                            # Get process name using wmic
                            proc_info = subprocess.run(
                                ["wmic", "process", "where", f"ProcessId={pid_int}", "get", "Name", "/format:csv"],
                                capture_output=True,
                                text=True,
                                encoding="utf-8",
                                errors="replace"
                            )
                            proc_name = "Unknown"
                            for pline in proc_info.stdout.splitlines():
                                if "ProcessId" not in pline and pline.strip():
                                    parts2 = pline.split(",")
                                    if len(parts2) >= 2:
                                        proc_name = parts2[-1].strip()
                                    break
                            processes.append({
                                "pid": pid_int,
                                "name": proc_name,
                                "port": port
                            })
                        except ValueError:
                            pass
        except FileNotFoundError:
            # wmic not found, fallback
            pass
        except Exception as e:
            print(f"  [!] netstat query failed: {e}")
    else:
        # Linux/Mac: use lsof or ss
        try:
            result = subprocess.run(
                ["lsof", "-i", f":{port}", "-P", "-n"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            for line in result.stdout.splitlines()[1:]:
                parts = line.split()
                if len(parts) >= 2:
                    try:
                        processes.append({
                            "pid": int(parts[1]),
                            "name": parts[0],
                            "port": port
                        })
                    except ValueError:
                        pass
        except FileNotFoundError:
            # lsof not available, try ss
            try:
                result = subprocess.run(
                    ["ss", "-tlnp", f"sport = :{port}"],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace"
                )
                for line in result.stdout.splitlines()[1:]:
                    if f":{port}" in line:
                        import re
                        match = re.search(r'pid=(\d+)', line)
                        if match:
                            processes.append({
                                "pid": int(match.group(1)),
                                "name": "Unknown",
                                "port": port
                            })
            except Exception:
                pass
    
    return processes

def kill_process(pid: int, name: str) -> bool:
    """Kill the specified process"""
    try:
        if sys.platform == "win32":
            # Windows
            result = subprocess.run(
                ["taskkill", "/F", "/PID", str(pid)],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            success = result.returncode == 0
            if success:
                print(f"  [OK] Killed: {name} (PID: {pid})")
            else:
                print(f"  [!] Kill failed: {result.stderr.strip()}")
            return success
        else:
            # Linux/Mac
            os.kill(pid, signal.SIGTERM)
            print(f"  [OK] Killed: {name} (PID: {pid})")
            return True
    except ProcessLookupError:
        print(f"  [~] Process not found: {pid}")
        return True
    except PermissionError:
        print(f"  [!] Permission denied: {name} (PID: {pid})")
        print(f"      Try using sudo")
        return False
    except Exception as e:
        print(f"  [!] Error killing process: {e}")
        return False

def cleanup_port(port: int) -> None:
    """Clean up all processes occupying the specified port"""
    print(f"\n{'='*60}")
    print(f"Port {port} Check")
    print(f"{'='*60}")
    
    processes = find_process_on_port(port)
    
    if not processes:
        print(f"  [OK] Port {port} is free")
        return
    
    print(f"  [!] Found {len(processes)} process(es) on port {port}:")
    
    killed_any = False
    for proc in processes:
        # Skip self (if any)
        if proc["pid"] == os.getpid():
            print(f"  [~] Skipping self: {proc['name']} (PID: {proc['pid']})")
            continue
        
        if kill_process(proc["pid"], proc["name"]):
            killed_any = True
            time.sleep(0.5)  # Wait for port release
    
    if killed_any:
        # Verify port is released
        time.sleep(1)
        remaining = find_process_on_port(port)
        if remaining:
            print(f"  [!] Warning: {len(remaining)} process(es) still on port")
            for p in remaining:
                print(f"      - {p['name']} (PID: {p['pid']})")
        else:
            print(f"  [OK] Port {port} is now free")

def start_backend() -> None:
    """Start the backend service"""
    # Change to backend directory (where run.py is located)
    script_dir = Path(__file__).resolve().parent
    
    # Try to find run.py by going up
    backend_dir = script_dir
    for _ in range(5):
        backend_dir = backend_dir.parent
        if (backend_dir / "run.py").exists():
            break
    else:
        backend_dir = script_dir.parent
    
    os.chdir(backend_dir)
    run_py = backend_dir / "run.py"
    
    # Get configured port
    port = get_configured_port()
    
    print(f"\n{'='*60}")
    print(f"TRAI Backend Start Script")
    print(f"{'='*60}")
    print(f"Backend Dir: {backend_dir}")
    print(f"Run Script: {run_py}")
    print(f"Target Port: {port}")
    print(f"Python: {sys.executable}")
    print(f"Platform: {'Windows' if sys.platform == 'win32' else 'Linux/Mac'}")
    print(f"{'='*60}\n")
    
    # Clean up processes on port
    cleanup_port(port)
    
    # Create log directory and file
    log_dir = backend_dir / "logs"
    log_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"backend_{timestamp}.log"
    
    # Start backend
    print(f"{'='*60}")
    print(f"[START] Starting Backend...")
    print(f"{'='*60}")
    
    import io
    proc = subprocess.Popen(
        [sys.executable, str(run_py)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        cwd=str(backend_dir)
    )
    
    print(f"[PID] {proc.pid}")
    print(f"[LOG] {log_file}")
    print(f"[URL] http://localhost:{port}")
    print(f"[HINT] Press Ctrl+C to stop")
    print(f"{'='*60}\n")
    
    # Stream logs to terminal and file
    import io
    
    proc = subprocess.Popen(
        [sys.executable, str(run_py)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        cwd=str(backend_dir)
    )
    
    print(f"[PID] {proc.pid}")
    print(f"[LOG] {log_file}")
    print(f"[URL] http://localhost:{port}")
    print(f"[HINT] Press Ctrl+C to stop")
    print(f"{'='*60}\n")
    
    # Use text wrapper for proper encoding
    text_io = io.TextIOWrapper(proc.stdout, encoding="utf-8", errors="replace", line_buffering=True)
    
    # Set up safe output for Windows
    if sys.platform == "win32":
        import io
        # Create a wrapper that handles encoding errors
        class SafeWriter:
            def __init__(self, original):
                self.original = original
            
            def write(self, text):
                try:
                    self.original.write(text)
                except UnicodeEncodeError:
                    # Replace problematic chars
                    safe = text.encode("utf-8", errors="replace").decode("utf-8", errors="replace")
                    self.original.write(safe)
            
            def flush(self):
                self.original.flush()
        
        safe_out = SafeWriter(sys.stdout)
    else:
        safe_out = sys.stdout
    
    with open(log_file, "w", encoding="utf-8") as f:
        try:
            while True:
                line = text_io.readline()
                if not line and proc.poll() is not None:
                    safe_out.write(f"\n[EXIT] Backend exited with code: {proc.returncode}\n")
                    break
                if line:
                    safe_out.write(line.rstrip() + "\n")
                    f.write(line)
                    f.flush()
        except KeyboardInterrupt:
            safe_out.write("\n[STOP] Stopping backend...\n")
            proc.terminate()
            try:
                proc.wait(timeout=5)
                safe_out.write("[STOP] Backend stopped\n")
            except subprocess.TimeoutExpired:
                safe_out.write("[KILL] Force killing...\n")
                if sys.platform == "win32":
                    subprocess.run(["taskkill", "/F", "/PID", str(proc.pid)], capture_output=True)
                else:
                    proc.kill()
                safe_out.write("[KILL] Backend killed\n")


if __name__ == "__main__":
    start_backend()
