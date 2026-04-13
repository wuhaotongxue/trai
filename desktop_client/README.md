# -*- coding: utf-8 -*-
# 文件名: README.md
# 作者: TRAI-Team
# 日期: 2026_04_13
# 描述: trai-desktop-client 桌面客户端说明文档

# TRAI Desktop Client

基于 Python 3.11 + PyQt6 的桌面客户端应用。

## 技术栈

- Python 3.11
- PyQt6 6.6+
- requests 2.31+
- loguru 0.7.2+

## 项目架构

采用五层架构设计:

- `src/ui/` - 表示层 (PyQt6 控件)
- `src/controller/` - 控制层 (事件监听、命令分发)
- `src/service/` - 服务层 (业务流程)
- `src/comm/` - 通信层 (HTTP 封装)
- `src/infra/` - 基础设施层 (日志、配置)

## 功能模块

- 登录功能
- 注册功能
- 用户信息展示
- 退出登录

## 运行方式

```bash
pip install -r requirements.txt
python main.py
```

## 打包方式

```bash
pyinstaller --onefile --windowed --name TRAI-Desktop-Client main.py
```

## 环境要求

- Python 3.11
- Conda 环境: pyqt6_3_11_15_whf_20260320
- 后端 API: http://localhost:5666
