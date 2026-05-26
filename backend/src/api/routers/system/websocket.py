#!/usr/bin/env python
# 文件名: websocket.py
# 作者: wuhao
# 日ly: 2026_05_26_20:42:13
# 描述: WebSocket 路由端点, 支持实时消息推送、会话订阅及 AI 流式输出

from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from infrastructure.websocket.websocket_manager import (
    ws_manager,
)

router = APIRouter()


class WebSocketRouter:
    """
    WebSocket 路由处理器类, 封装所有实时通信端点逻辑
    """

    @staticmethod
    @router.websocket("/ws/{user_id}")
    async def websocket_endpoint(
        websocket: WebSocket,
        user_id: str,
    ) -> None:
        """
        主 WebSocket 连接端点

        参数:
            websocket (WebSocket): WebSocket 连接对象
            user_id (str): 用户唯一标识
        返回值:
            None
        """
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

    @staticmethod
    @router.websocket("/ws/{user_id}/session/{session_id}")
    async def session_websocket_endpoint(
        websocket: WebSocket,
        user_id: str,
        session_id: str,
    ) -> None:
        """
        会话级 WebSocket 连接端点, 自动订阅指定会话

        参数:
            websocket (WebSocket): WebSocket 连接对象
            user_id (str): 用户唯一标识
            session_id (str): 会话唯一标识
        返回值:
            None
        """
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


# 创建路由实例兼容旧版引用
websocket_router = WebSocketRouter()


__all__ = ["WebSocketRouter", "websocket_router", "router"]
