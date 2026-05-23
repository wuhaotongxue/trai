#!/usr/bin/env python
# 文件名: activate_version.py
# 作者: wuhao
# 日期: 2026_05_23_17:28:12
# 描述: 自动补充的文件头说明.

"""
文件名: activate_version.py
作者: wuhao
日期: 2026_04_25_04:40:00
描述: 激活客户端发布版本
"""

import sys
from pathlib import Path

# 确保 backend 路径
_backend_path = Path(__file__).parent.parent / "backend"
if _backend_path.exists():
    sys.path.insert(0, str(_backend_path.resolve()))

from sqlalchemy import update

from infrastructure.database import get_session
from infrastructure.database.models import ClientReleaseModel


class ActivateVersionRunner:
    """
    执行版本激活任务的封装类.
    
    参数:
        无
        
    返回:
        None: 无返回值
        
    异常:
        Exception: 捕获并记录所有执行异常
    """
    
    @staticmethod
    def main():
        """
        激活指定版本的主函数.
        
        参数:
            无
            
        返回:
            None: 无返回值
            
        异常:
            Exception: 捕获并记录所有执行异常
        """
        version = sys.argv[1] if len(sys.argv) > 1 else input("Enter version to activate: ")
        
        with get_session() as session:
            # 先取消所有版本的激活状态
            session.execute(
                update(ClientReleaseModel).where(ClientReleaseModel.t_is_active == True).values(t_is_active=False)
            )
            
            # 激活目标版本
            result = session.execute(
                update(ClientReleaseModel).where(ClientReleaseModel.t_version == version).values(t_is_active=True)
            )
            
            if result.rowcount > 0:
                session.commit()
                print(f"✅ Successfully activated version {version}")
            else:
                session.rollback()
                print(f"❌ Version {version} not found in database")


if __name__ == "__main__":
    ActivateVersionRunner.main()
