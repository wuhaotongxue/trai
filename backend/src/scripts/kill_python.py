import os
import subprocess

from loguru import logger

# Get current Python process PID
current_pid = os.getpid()
logger.info(f"Current PID: {current_pid}")

# Get all Python PIDs via PowerShell
result = subprocess.run(
    ["powershell", "-Command", "Get-Process python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"],
    capture_output=True,
    text=True,
)
pids = []
for line in result.stdout.strip().split("\n"):
    line = line.strip()
    if line.isdigit():
        pid = int(line)
        if pid != current_pid:
            pids.append(pid)

logger.info(f"Found {len(pids)} other Python processes: {pids}")

for pid in pids:
    try:
        os.kill(pid, 9)
        logger.info(f"Killed PID {pid}")
    except Exception as e:
        logger.error(f"Failed to kill PID {pid}: {e}")

logger.info("Done")
