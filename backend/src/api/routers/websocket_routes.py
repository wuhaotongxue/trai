#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: websocket_routes.py
# 作者: wuhao
# 日期: 2026_05_04_17:15:00
# 描述: WebSocket 路由端点 (Skills合规: 类封装)

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from infrastructure.websocket.websocket_manager import (
    MessageType,
    WSMessage,
    ws_manager,
)


class WebSocketRouter:
    """
    WebSocket 路由类 (Skills 规范: 强制类封装)
    
    功能:
    - 实时消息推送
    - 会话订阅管理
    - AI流式输出推送
    """
    
    def __init__(self):
        self.router = APIRouter()
        self._register_routes()
    
    def _register_routes(self) -> None:
        """注册所有WebSocket路由"""
        
        @self.router.websocket("/ws/{user_id}")
        async def websocket_endpoint(
            websocket: WebSocket,
            user_id: str,
        ):
            """主WebSocket连接端点"""
            
            # 接受连接
            connected = await ws_manager.connect(websocket, user_id)
            if not connected:
                return
            
            try:
                # 持续监听消息
                while True:
                    # 接收客户端消息
                    raw_data = await websocket.receive_text()
                    
                    # 处理消息
                    result = await ws_manager.handle_message(user_id, raw_data)
                    
                    logger.debug(f"WS message handled | user={user_id} | type={result.get('action')}")
                    
            except WebSocketDisconnect:
                ws_manager.disconnect(user_id, websocket)
                
            except Exception as e:
                logger.error(f"WS error | user={user_id} | error={e}")
                ws_manager.disconnect(user_id, websocket)
        
        @self.router.websocket("/ws/{user_id}/session/{session_id}")
        async def session_websocket_endpoint(
            websocket: WebSocket,
            user_id: str,
            session_id: str,
        ):
            """会话级WebSocket连接(自动订阅指定会话)"""
            
            # 接受连接并自动订阅会话
            connected = await ws_manager.connect(
                websocket,
                user_id,
                session_ids=[session_id],
            )
            if not connected:
                return
            
            try:
                while True:
                    raw_data = await websocket.receive_text()
                    await ws_manager.handle_message(user_id, raw_data)
                    
            except WebSocketDisconnect:
                ws_manager.disconnect(user_id, websocket)
                
            except Exception as e:
                logger.error(f"Session WS error | session={session_id} | error={e}")
                ws_manager.disconnect(user_id, websocket)


# 创建路由实例
websocket_router = WebSocketRouter()


__all__ = ["WebSocketRouter", "websocket_router"]
