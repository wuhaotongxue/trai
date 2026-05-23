#!/usr/bin/env python
# 文件名: publish_client.py
# 作者: wuhao
# 日期: 2026_05_23_17:28:12
# 描述: 自动补充的文件头说明.

"""
文件名: publish_client.py
作者: wuhao
日期: 2026_04_25_04:30:00
描述: TRAI 客户端一键发布脚本 - 打包后自动上传到 S3
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

import requests
from loguru import logger

# 添加 backend 路径以便导入
_backend_path = Path(__file__).parent.parent / "backend"
if _backend_path.exists():
    sys.path.insert(0, str(_backend_path.resolve()))

# 加载环境变量
try:
    from run import EnvFileLoader

    EnvFileLoader.load_local_envs()
except ImportError:
    pass


class ClientPublisher:
    """客户端一键发布器"""

    def __init__(self, api_url: str, admin_token: str):
        self.api_url = api_url.rstrip("/")
        self.admin_token = admin_token
        self.client_dir = Path(__file__).parent
        self.release_dir = self.client_dir / "release"

    def run_build(self) -> tuple[bool, str]:
        """执行 Electron 构建"""
        logger.info("=" * 50)
        logger.info("Step 1/4: 构建 Electron 客户端...")
        logger.info("=" * 50)

        try:
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=str(self.client_dir),
                capture_output=True,
                text=True,
                timeout=600,  # 10 分钟超时
            )

            if result.returncode != 0:
                logger.error(f"构建失败: {result.stderr}")
                return False, result.stderr

            logger.info("构建成功!")
            return True, ""
        except subprocess.TimeoutExpired:
            logger.error("构建超时 (超过 10 分钟)")
            return False, "构建超时"
        except FileNotFoundError:
            logger.error("未找到 npm, 请确保 Node.js 已安装")
            return False, "npm not found"
        except Exception as e:
            logger.error(f"构建异常: {str(e)}")
            return False, str(e)

    def find_artifacts(self) -> tuple[Path | None, Path | None]:
        """查找构建产物"""
        logger.info("=" * 50)
        logger.info("Step 2/4: 查找构建产物...")
        logger.info("=" * 50)

        # 查找 latest.yml (electron-builder 生成)
        yml_files = list(self.release_dir.glob("*.yml")) + list(self.release_dir.glob("*-yml"))
        # 也可能在 win-unpacked 或其他位置
        if not yml_files:
            yml_files = list(self.release_dir.rglob("*.yml"))

        # 查找 exe 安装包
        exe_files = list(self.release_dir.glob("*.exe"))

        # 如果在 win-unpacked 中
        win_unpacked = self.release_dir / "win-unpacked"
        if win_unpacked.exists() and not exe_files:
            exe_files = list(win_unpacked.glob("*.exe"))

        yml_path = yml_files[0] if yml_files else None
        exe_path = exe_files[0] if exe_files else None

        if yml_path:
            logger.info(f"找到 latest.yml: {yml_path}")
        else:
            logger.warning("未找到 latest.yml 文件")

        if exe_path:
            logger.info(f"找到安装包: {exe_path}")
        else:
            logger.error("未找到安装包 (.exe) 文件")

        return yml_path, exe_path

    def read_latest_yml(self, yml_path: Path) -> dict:
        """读取 latest.yml 内容"""
        import yaml

        with open(yml_path, encoding="utf-8") as f:
            return yaml.safe_load(f)

    def read_release_notes(self) -> str:
        """读取更新日志"""
        changelog_path = self.client_dir / "CHANGELOG.md"
        if changelog_path.exists():
            with open(changelog_path, encoding="utf-8") as f:
                content = f.read()
                # 简单提取第一条记录
                lines = content.split("\n")
                notes = []
                for line in lines[:50]:  # 取前 50 行
                    if line.startswith("#") or line.startswith("##"):
                        if notes:
                            break
                    elif line.strip():
                        notes.append(line.strip())
                return "\n".join(notes[:10])
        return ""

    def upload_to_s3(
        self, version: str, yml_path: Path, exe_path: Path, release_notes: str | None = None
    ) -> tuple[bool, str]:
        """上传到 S3"""
        logger.info("=" * 50)
        logger.info("Step 3/4: 上传到 S3...")
        logger.info("=" * 50)

        api_endpoint = f"{self.api_url}/api_trai/v1/admin/client/release"

        try:
            with open(yml_path, "rb") as yml_file, open(exe_path, "rb") as exe_file:
                files = {
                    "latest_yml": (yml_path.name, yml_file, "application/x-yaml"),
                    "installer_exe": (exe_path.name, exe_file, "application/x-msdownload"),
                }

                data = {
                    "version": version,
                    "release_notes": release_notes or "",
                }

                headers = {
                    "Authorization": f"Bearer {self.admin_token}",
                }

                logger.info(f"上传到: {api_endpoint}")
                logger.info(f"版本: {version}")

                response = requests.post(
                    api_endpoint,
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=300,  # 5 分钟超时
                )

                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"上传成功: {result.get('message', '成功')}")
                    return True, result.get("message", "上传成功")
                else:
                    error_msg = f"上传失败 (HTTP {response.status_code}): {response.text}"
                    logger.error(error_msg)
                    return False, error_msg

        except requests.exceptions.Timeout:
            logger.error("上传超时 (超过 5 分钟)")
            return False, "上传超时"
        except requests.exceptions.ConnectionError:
            logger.error(f"无法连接到服务器: {api_endpoint}")
            return False, f"连接失败: {api_endpoint}"
        except FileNotFoundError as e:
            logger.error(f"文件不存在: {e}")
            return False, str(e)
        except Exception as e:
            logger.error(f"上传异常: {str(e)}")
            return False, str(e)

    def print_summary(self, version: str, exe_path: Path, success: bool, message: str):
        """打印发布摘要"""
        logger.info("=" * 50)
        logger.info("Step 4/4: 发布完成")
        logger.info("=" * 50)

        if success:
            logger.info(f"[OK] 版本 {version} 发布成功!")
            logger.info(f"[OK] 安装包: {exe_path}")
            logger.info(f"[OK] 状态: {message}")
            logger.info("")
            logger.info("客户端用户可通过以下方式更新:")
            logger.info("  1. 打开应用 -> 设置 -> 系统更新 -> 检查更新")
            logger.info(f"  2. 或访问: {self.api_url}/api_trai/v1/client/update/latest.yml")
        else:
            logger.error(f"[FAIL] 发布失败: {message}")

    def publish(self, version: str | None = None) -> bool:
        """执行完整发布流程"""
        logger.info("TRAI 客户端一键发布工具")
        logger.info(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("-" * 50)

        # 1. 构建
        build_ok, build_error = self.run_build()
        if not build_ok:
            logger.error(f"构建失败: {build_error}")
            return False

        # 2. 查找产物
        yml_path, exe_path = self.find_artifacts()
        if not exe_path:
            logger.error("未找到安装包文件")
            return False

        # 3. 获取版本号
        if not version:
            if yml_path:
                try:
                    yml_data = self.read_latest_yml(yml_path)
                    version = yml_data.get("version", "")
                except Exception:
                    pass

            if not version:
                # 从 exe 文件名提取
                version = exe_path.stem.replace("TRAI Setup ", "").strip()
                if not version:
                    version = input("请输入版本号 (如 1.0.0): ").strip()

        logger.info(f"发布版本: {version}")

        # 4. 读取更新日志
        release_notes = self.read_release_notes()

        # 5. 上传到 S3
        if not yml_path:
            logger.warning("未找到 latest.yml, 将只上传安装包")
            # 创建简单的 yml 内容
            import yaml

            yml_data = {
                "version": version,
                "releaseDate": datetime.now().isoformat(),
                "files": [{"url": exe_path.name, "sha512": "placeholder", "size": exe_path.stat().st_size}],
            }
            yml_content = yaml.dump(yml_data)
            yml_path = self.release_dir / f"TRAI-{version}-x64.yml"
            with open(yml_path, "w") as f:
                f.write(yml_content)
            logger.info(f"已生成: {yml_path}")

        upload_ok, upload_message = self.upload_to_s3(version, yml_path, exe_path, release_notes)

        # 6. 打印摘要
        self.print_summary(version, exe_path, upload_ok, upload_message)

        return upload_ok


def main():
    parser = argparse.ArgumentParser(description="TRAI 客户端一键发布工具")
    parser.add_argument(
        "--api-url",
        type=str,
        default=os.getenv("TRAI_API_URL", "http://127.0.0.1:5666"),
        help="后端 API 地址 (默认: http://127.0.0.1:5666)",
    )
    parser.add_argument(
        "--token",
        type=str,
        default=os.getenv("TRAI_ADMIN_TOKEN", ""),
        help="管理员 Token (或设置 TRAI_ADMIN_TOKEN 环境变量)",
    )
    parser.add_argument("--version", type=str, help="版本号 (如 1.0.0), 如不指定则从 latest.yml 读取")

    args = parser.parse_args()

    if not args.token:
        logger.error("请提供管理员 Token (--token 或设置 TRAI_ADMIN_TOKEN 环境变量)")
        sys.exit(1)

    publisher = ClientPublisher(args.api_url, args.token)
    success = publisher.publish(args.version)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
