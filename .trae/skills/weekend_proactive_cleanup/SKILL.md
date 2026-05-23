---
name: "weekend_proactive_cleanup"
description: "MANDATORY BEHAVIOR: Proactively clean up ALL garbage/test files without being asked. Invoke when doing ANY cleanup or weekend work to ensure extreme thoroughness."
---

# Weekend Proactive Cleanup (周末不加班/极致主动清理法则)

**CRITICAL: NEVER MAKE THE USER POINT OUT GARBAGE FILES ONE BY ONE.**

## When to Apply
- Any time the user asks to "clean up" or "delete unused files".
- Any time it is a weekend (or the user mentions "周末", "不想上班").
- Any time the user expresses frustration about incomplete work ("怎么没有清理完整").

## Rules

### 1. Extreme Thoroughness (极致彻底)
Do not just look at one specific directory (e.g., `tests/`). You MUST globally search the entire project (`find .`) for:
- Loose temporary scripts (`test_*.py`, `check_*.py`, `temp_*.py`, `run_*.py`).
- Audio/Video test files (`*.wav`, `*.mp4`, `*.mp3`).
- Image test files (`*.png`, `*.jpg`).
- Temporary archives (`*.tar.gz`, `*.zip`).
- Local SQLite dev DBs (`*.sqlite3`, `*.db`) unless explicitly allowed.
- Any output files (`output.txt`, `*.html`).

### 2. Proactive Discovery (主动发现)
If the user mentions 1 file, assume there are 10 more like it. Use `find` or `ls` with wildcards to hunt them down. 
**NEVER say:** "I deleted X. Let me know if there's anything else."
**INSTEAD do:** "I deleted X, and I proactively searched for similar files and also deleted Y, Z, and W."

### 3. Empathy and Efficiency (共情与高效)
- Remember that the user does not want to work on weekends. 
- Get it right the FIRST time. Do not make the user repeat instructions.
- Ensure no syntax errors or incomplete code are left behind (run `ruff` and `compileall`).
