#!/usr/bin/env python
# 文件名: websocket_manager.py
# 作者: wuhao
# 日期: 2026_05_04_17:00:00
# 描述: WebSocket连接管理器 (Skills合规: 类封装)

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import WebSocket
from loguru import logger


class MessageType(str, Enum):
    """消息类型"""

    # 系统消息
    CONNECTION = "connection"
    HEARTBEAT = "heartbeat"
    ERROR = "error"

    # 业务消息
    CHAT_MESSAGE = "chat_message"
    SESSION_UPDATE = "session_update"
    NOTIFICATION = "notification"

    # AI相关
    AI_STREAM_START = "ai_stream_start"
    AI_STREAM_CHUNK = "ai_stream_chunk"
    AI_STREAM_END = "ai_stream_end"


@dataclass
class WSMessage:
    """WebSocket 消息数据类"""

    type: MessageType
    data: dict[str, Any] = field(default_factory=dict)
    session_id: str | None = None
    user_id: str | None = None
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict[str, Any]:
        """转换为字典(用于JSON序列化)"""
        return {
            "type": self.type.value,
            "data": self.data,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "timestamp": self.timestamp,
        }

    def to_json(self) -> str:
        """转换为JSON字符串"""
        return json.dumps(self.to_dict(), ensure_ascii=False)


class ConnectionManager:
    """
    WebSocket 连接管理器类 (Skills 规范: 强制类封装)

    功能:
    - 管理多个WebSocket连接
    - 支持按用户/会话分组广播
    - 心跳检测和自动断开
    - 消息队列缓冲
    - 连接统计和监控

    使用示例:
        manager = ConnectionManager()

        @app.websocket("/ws/{user_id}")
        async def websocket_endpoint(websocket: WebSocket, user_id: str):
            await manager.connect(websocket, user_id)

            try:
                while True:
                    data = await websocket.receive_text()
                    await manager.handle_message(user_id, data)
            except WebSocketDisconnect:
                manager.disconnect(user_id)
    """

    # 配置常量
    DEFAULT_CONFIG = {
        "heartbeat_interval": 30,  # 心跳间隔(秒)
        "heartbeat_timeout": 60,  # 心跳超时(秒)
        "max_connections_per_user": 5,  # 单用户最大连接数
        "max_message_size": 1024 * 1024,  # 最大消息大小(1MB)
        "message_queue_size": 100,  # 消息队列最大长度
    }

    def __init__(self, config: dict[str, Any] | None = None):
        """
        初始化连接管理器

        Args:
            config: 自定义配置(可选)
        """
        self.config = self.DEFAULT_CONFIG.copy()
        if config:
            self.config.update(config)

        # 存储活跃连接 {user_id: [WebSocket]}
        self._active_connections: dict[str, set[WebSocket]] = {}

        # 存储会话订阅关系 {session_id: Set[user_id]}
        self._session_subscriptions: dict[str, set[str]] = {}

        # 连接元数据 {id(user_id): connection_info}
        self._connection_info: dict[str, dict] = {}

        # 统计信息
        self._stats = {
            "total_connections": 0,
            "current_connections": 0,
            "messages_sent": 0,
            "messages_received": 0,
            "errors": 0,
        }

        logger.info("ConnectionManager initialized")

    async def connect(
        self,
        websocket: WebSocket,
        user_id: str,
        session_ids: list[str] | None = None,
    ) -> bool:
        """
        接受新的WebSocket连接

        Args:
            websocket: WebSocket实例
            user_id: 用户ID
            session_ids: 要订阅的会话ID列表

        Returns:
            是否成功连接
        """
        # 检查单用户连接数限制
        existing_count = len(self._active_connections.get(user_id, set()))
        if existing_count >= self.config["max_connections_per_user"]:
            await self._send_error(websocket, "Too many connections")
            return False

        # 接受连接
        await websocket.accept()

        # 存储连接
        if user_id not in self._active_connections:
            self._active_connections[user_id] = set()
        self._active_connections[user_id].add(websocket)

        # 记录连接信息
        conn_id = f"{user_id}_{datetime.now().timestamp()}"
        self._connection_info[id(websocket)] = {
            "conn_id": conn_id,
            "user_id": user_id,
            "connected_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat(),
            "subscribed_sessions": set(),
        }

        # 订阅指定会话
        if session_ids:
            for sid in session_ids:
                self.subscribe_to_session(user_id, sid)

        # 更新统计
        self._stats["total_connections"] += 1
        self._stats["current_connections"] += 1

        # 发送欢迎消息
        welcome_msg = WSMessage(
            type=MessageType.CONNECTION,
            data={
                "status": "connected",
                "conn_id": conn_id,
                "server_time": datetime.now().isoformat(),
            },
            user_id=user_id,
        )
        await self.send_personal_message(welcome_msg, user_id)

        logger.info(f"WS connected | user={user_id} | total={self._stats['current_connections']}")

        return True

    def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        """
        断开WebSocket连接

        Args:
            user_id: 用户ID
            websocket: WebSocket实例
        """
        if user_id in self._active_connections:
            self._active_connections[user_id].discard(websocket)

            # 如果用户没有其他连接了,清理
            if not self._active_connections[user_id]:
                del self._active_connections[user_id]

                # 取消所有会话订阅
                for sid, subscribers in list(self._session_subscriptions.items()):
                    subscribers.discard(user_id)
                    if not subscribers:
                        del self._session_subscriptions[sid]

        # 清理连接信息
        if id(websocket) in self._connection_info:
            del self._connection_info[id(websocket)]

        # 更新统计
        self._stats["current_connections"] -= 1

        logger.info(f"WS disconnected | user={user_id} | remaining={self._stats['current_connections']}")

    def subscribe_to_session(self, user_id: str, session_id: str) -> None:
        """
        订阅会话更新

        Args:
            user_id: 用户ID
            session_id: 会话ID
        """
        if session_id not in self._session_subscriptions:
            self._session_subscriptions[session_id] = set()
        self._session_subscriptions[session_id].add(user_id)

        # 更新连接信息中的订阅列表
        for ws in self._active_connections.get(user_id, set()):
            if id(ws) in self._connection_info:
                self._connection_info[id(ws)]["subscribed_sessions"].add(session_id)

        logger.debug(f"Session subscribed | user={user_id} | session={session_id}")

    def unsubscribe_from_session(self, user_id: str, session_id: str) -> None:
        """
        取消订阅会话

        Args:
            user_id: 用户ID
            session_id: 会话ID
        """
        if session_id in self._session_subscriptions:
            self._session_subscriptions[session_id].discard(user_id)
            if not self._session_subscriptions[session_id]:
                del self._session_subscriptions[session_id]

    async def send_personal_message(
        self,
        message: WSMessage,
        user_id: str,
    ) -> int:
        """
        发送个人消息(点对点)

        Args:
            message: WSMessage对象
            user_id: 目标用户ID

        Returns:
            成功发送的连接数
        """
        sent_count = 0

        connections = self._active_connections.get(user_id, set())
        disconnected_ws = set()

        for ws in connections:
            try:
                await ws.send_text(message.to_json())
                sent_count += 1

                # 更新活动时间
                if id(ws) in self._connection_info:
                    self._connection_info[id(ws)]["last_activity"] = datetime.now().isoformat()

            except Exception as e:
                logger.warning(f"Failed to send to {user_id}: {e}")
                disconnected_ws.add(ws)

        # 清理已断开的连接
        for ws in disconnected_ws:
            self.disconnect(user_id, ws)

        self._stats["messages_sent"] += sent_count

        return sent_count

    async def broadcast_to_session(
        self,
        message: WSMessage,
        session_id: str,
        exclude_user: str | None = None,
    ) -> int:
        """
        向会话的所有订阅者广播消息

        Args:
            message: WSMessage对象
            session_id: 会话ID
            exclude_user: 要排除的用户ID(通常是自己)

        Returns:
            成功发送的连接数
        """
        sent_count = 0
        subscribers = self._session_subscriptions.get(session_id, set())

        for user_id in subscribers:
            if user_id != exclude_user:  # 排除自己
                count = await self.send_personal_message(message, user_id)
                sent_count += count

        return sent_count

    async def broadcast_all(self, message: WSMessage) -> int:
        """
        向所有连接的客户端广播消息

        Args:
            message: WSMessage对象

        Returns:
            成功发送的连接数
        """
        sent_count = 0

        all_users = list(self._active_connections.keys())
        for user_id in all_users:
            count = await self.send_personal_message(message, user_id)
            sent_count += count

        return sent_count

    async def handle_message(self, user_id: str, raw_data: str) -> dict[str, Any]:
        """
        处理收到的客户端消息

        Args:
            user_id: 用户ID
            raw_data: 原始JSON数据

        Returns:
            处理结果字典
        """
        self._stats["messages_received"] += 1

        try:
            data = json.loads(raw_data)
            msg_type = data.get("type", "")

            # 更新活动时间
            for ws in self._active_connections.get(user_id, set()):
                if id(ws) in self._connection_info:
                    self._connection_info[id(ws)]["last_activity"] = datetime.now().isoformat()

            # 处理不同类型的消息
            if msg_type == MessageType.HEARTBEAT.value:
                return await self._handle_heartbeat(user_id, data)

            elif msg_type == "subscribe":
                session_id = data.get("session_id")
                if session_id:
                    self.subscribe_to_session(user_id, session_id)
                    return {"status": "ok", "action": "subscribed", "session_id": session_id}

            elif msg_type == "unsubscribe":
                session_id = data.get("session_id")
                if session_id:
                    self.unsubscribe_from_session(user_id, session_id)
                    return {"status": "ok", "action": "unsubscribed", "session_id": session_id}

            else:
                logger.warning(f"Unknown message type: {msg_type} from user={user_id}")
                return {"status": "error", "message": "Unknown message type"}

        except json.JSONDecodeError as e:
            self._stats["errors"] += 1
            logger.error(f"Invalid JSON from user={user_id}: {e}")
            return {"status": "error", "message": "Invalid JSON format"}

    async def _handle_heartbeat(self, user_id: str, data: dict) -> dict[str, Any]:
        """处理心跳消息"""
        pong = WSMessage(
            type=MessageType.HEARTBEAT,
            data={"pong": True},
            user_id=user_id,
        )
        await self.send_personal_message(pong, user_id)

        return {"status": "ok", "action": "pong"}

    async def _send_error(self, websocket: WebSocket, message: str) -> None:
        """发送错误消息并关闭连接"""
        error_msg = WSMessage(
            type=MessageType.ERROR,
            data={"message": message},
        )
        try:
            await websocket.send_text(error_msg.to_json())
            await websocket.close(code=4001, reason=message)
        except Exception:
            pass

    def get_stats(self) -> dict[str, Any]:
        """
        获取连接管理器统计信息

        Returns:
            统计字典
        """
        return {
            **self._stats,
            "active_users": len(self._active_connections),
            "total_active_connections": sum(len(conns) for conns in self._active_connections.values()),
            "subscribed_sessions": len(self._session_subscriptions),
            "config": self.config,
        }

    def get_connection_details(self, user_id: str) -> list[dict]:
        """
        获取用户的连接详情

        Args:
            user_id: 用户ID

        Returns:
            连接详情列表
        """
        details = []
        for ws in self._active_connections.get(user_id, set()):
            info = self._connection_info.get(id(ws), {})
            details.append(
                {
                    "conn_id": info.get("conn_id"),
                    "connected_at": info.get("connected_at"),
                    "last_activity": info.get("last_activity"),
                    "subscribed_sessions": len(info.get("subscribed_sessions", [])),
                }
            )
        return details


# 全局单例实例
ws_manager = ConnectionManager()


__all__ = [
    "ConnectionManager",
    "WSMessage",
    "MessageType",
    "ws_manager",
]
