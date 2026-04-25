import os
import subprocess

# Get current Python process PID
current_pid = os.getpid()
print(f"Current PID: {current_pid}")

# Get all Python PIDs via PowerShell
result = subprocess.run(
    ['powershell', '-Command', 'Get-Process python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id'],
    capture_output=True, text=True
)
pids = []
for line in result.stdout.strip().split('\n'):
    line = line.strip()
    if line.isdigit():
        pid = int(line)
        if pid != current_pid:
            pids.append(pid)

print(f"Found {len(pids)} other Python processes: {pids}")

for pid in pids:
    try:
        os.kill(pid, 9)
        print(f"Killed PID {pid}")
    except Exception as e:
        print(f"Failed to kill PID {pid}: {e}")

print("Done")
