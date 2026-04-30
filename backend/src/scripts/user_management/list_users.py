import os
import sys
from pathlib import Path

from loguru import logger

# Load env
base_dir = Path("e:/zzgit/tuoren/trai/backend")
env_file = base_dir / ".env"
if env_file.exists():
    content = env_file.read_text(encoding="utf-8")
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)

from infrastructure.database import get_database
from infrastructure.repositories.user_repository import UserRepository

db = get_database()
session = db.get_session()
repo = UserRepository(session)

from sqlalchemy import text
users = session.execute(text("SELECT t_id, t_username, t_email FROM t_users LIMIT 10"))
logger.info("Users in database:")
for u in users:
    logger.info(f"  ID: {u[0]}, Username: {u[1]}, Email: {u[2]}")
