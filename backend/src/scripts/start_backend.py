import os
import subprocess
import sys
from datetime import datetime

# Start backend in background with log output
os.chdir("e:/zzgit/tuoren/trai/backend")

# 创建日志文件路径
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "logs")
os.makedirs(log_dir, exist_ok=True)
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
log_file = os.path.join(log_dir, f"backend_{timestamp}.log")

# 启动后端，日志输出到文件
proc = subprocess.Popen(
    [sys.executable, "run.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
)

print(f"Backend starting with PID: {proc.pid}")
print(f"Log file: {log_file}")
print("Press Ctrl+C to stop the backend")

# 实时输出日志到终端，同时写入文件
with open(log_file, "w", encoding="utf-8") as f:
    try:
        while True:
            line = proc.stdout.readline()
            if not line and proc.poll() is not None:
                break
            if line:
                decoded_line = line.decode("utf-8", errors="replace").rstrip()
                print(decoded_line)
                f.write(decoded_line + "\n")
                f.flush()
    except KeyboardInterrupt:
        print("\nStopping backend...")
        proc.terminate()
        proc.wait(timeout=5)
        print("Backend stopped")
