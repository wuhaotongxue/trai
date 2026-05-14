#!/usr/bin/env python
# 文件名: init_db.py
# 描述: 初始化数据库表

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

os.chdir(os.path.dirname(__file__))

from infrastructure.database import get_database
from infrastructure.database.i18n_model import I18nStringModel, SystemSettingModel
from infrastructure.database.user_model import UserModel
from infrastructure.database.department_model import DepartmentModel, UserDepartmentMappingModel
from infrastructure.database.models import (
    ChatSessionModel, MessageModel, QuotaPlanModel, UserQuotaUsageModel,
    QuotaTransactionLogModel, ImageGenerationModel, UploadTaskModel,
    ClientReleaseModel, AuditLogModel, ContactMessageModel, EmailConfigModel,
    AgentRoleModel
)

if __name__ == "__main__":
    print("Initializing database tables...")
    db = get_database()
    db.create_tables()
    print("[OK] All tables created successfully!")
