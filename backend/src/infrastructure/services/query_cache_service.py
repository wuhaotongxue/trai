#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 文件名: query_cache_service.py
# 作者: wuhao
# 日期: 2026_05_04_15:10:00
# 描述: 查询缓存服务 - 优化数据库重复查询 (Skills合规: 类封装)

from __future__ import annotations

import hashlib
import json
import time
from functools import wraps
from typing import Any, Callable

from loguru import logger


class QueryCacheService:
    """
    查询缓存服务类 (Skills 规范: 强制类封装)
    
    功能:
    - 内存缓存层, 减少数据库查询次数
    - 支持TTL(生存时间)自动过期
    - 缓存键哈希生成
    - 命中率统计
    
    使用示例:
        cache = QueryCacheService(default_ttl=300)
        
        @cache.cached(ttl=60)
        def get_session(session_id):
            return session_repo.get_session(session_id)
    """
    
    # 类级别的缓存存储(单例模式)
    _cache_store: dict[str, dict[str, Any]] = {}
    
    # 统计信息
    _stats = {
        "hits": 0,
        "misses": 0,
        "evictions": 0,
    }
    
    def __init__(
        self,
        default_ttl: int = 300,
        max_size: int = 1000,
        enabled: bool = True,
    ):
        """
        初始化缓存服务
        
        Args:
            default_ttl: 默认缓存过期时间(秒), 默认5分钟
            max_size: 最大缓存条目数
            enabled: 是否启用缓存
        """
        self.default_ttl = default_ttl
        self.max_size = max_size
        self.enabled = enabled
        
        logger.info(
            f"QueryCacheService initialized | ttl={default_ttl}s | "
            f"max_size={max_size} | enabled={enabled}"
        )
    
    def _generate_cache_key(self, func_name: str, *args, **kwargs) -> str:
        """
        生成缓存键
        
        Args:
            func_name: 函数名称
            *args: 位置参数
            **kwargs: 关键字参数
            
        Returns:
            MD5 哈希的缓存键
        """
        key_data = {
            "func": func_name,
            "args": args,
            "kwargs": kwargs,
        }
        
        key_str = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, key: str) -> Any | None:
        """
        获取缓存值
        
        Args:
            key: 缓存键
            
        Returns:
            缓存的值, 如果不存在或已过期则返回 None
        """
        if not self.enabled:
            return None
        
        cached_item = self._cache_store.get(key)
        
        if cached_item is None:
            self._stats["misses"] += 1
            return None
        
        # 检查是否过期
        if time.time() > cached_item["expires_at"]:
            del self._cache_store[key]
            self._stats["misses"] += 1
            self._stats["evictions"] += 1
            return None
        
        self._stats["hits"] += 1
        logger.debug(f"Cache hit | key={key[:8]}...")
        return cached_item["value"]
    
    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        """
        设置缓存值
        
        Args:
            key: 缓存键
            value: 要缓存的值
            ttl: 过期时间(秒), 默认使用 default_ttl
        """
        if not self.enabled:
            return
        
        # 检查缓存大小限制
        if len(self._cache_store) >= self.max_size:
            self._evict_oldest()
        
        actual_ttl = ttl or self.default_ttl
        self._cache_store[key] = {
            "value": value,
            "created_at": time.time(),
            "expires_at": time.time() + actual_ttl,
            "ttl": actual_ttl,
        }
        
        logger.debug(f"Cache set | key={key[:8]}... | ttl={actual_ttl}s")
    
    def delete(self, key: str) -> bool:
        """
        删除缓存项
        
        Args:
            key: 缓存键
            
        Returns:
            是否成功删除
        """
        if key in self._cache_store:
            del self._cache_store[key]
            logger.debug(f"Cache deleted | key={key[:8]}...")
            return True
        return False
    
    def clear(self) -> None:
        """清空所有缓存"""
        count = len(self._cache_store)
        self._cache_store.clear()
        logger.info(f"Cache cleared | removed {count} items")
    
    def _evict_oldest(self) -> None:
        """淘汰最旧的缓存项(LRU策略)"""
        if not self._cache_store:
            return
        
        oldest_key = min(
            self._cache_store.keys(),
            key=lambda k: self._cache_store[k]["created_at"]
        )
        
        del self._cache_store[oldest_key]
        self._stats["evictions"] += 1
        logger.debug(f"Evicted oldest cache item | key={oldest_key[:8]}...")
    
    def cached(self, ttl: int | None = None):
        """
        缓存装饰器工厂方法
        
        Args:
            ttl: 过期时间(秒), 默认使用实例的 default_ttl
            
        Returns:
            装饰器函数
            
        使用示例:
            @cache.cached(ttl=60)
            def get_session(session_id):
                ...
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                if not self.enabled:
                    return func(*args, **kwargs)
                
                cache_key = self._generate_cache_key(
                    func.__name__,
                    *args,
                    **kwargs
                )
                
                # 尝试从缓存获取
                cached_value = self.get(cache_key)
                if cached_value is not None:
                    return cached_value
                
                # 执行原函数
                result = func(*args, **kwargs)
                
                # 存入缓存
                self.set(cache_key, result, ttl=ttl)
                
                return result
            
            return wrapper
        return decorator
    
    def invalidate_pattern(self, pattern: str) -> int:
        """
        根据模式使缓存失效(简化版, 实际应使用正则)
        
        Args:
            pattern: 键名包含的字符串
            
        Returns:
            使失效的条目数
        """
        keys_to_delete = [
            k for k in self._cache_store.keys() if pattern in k
        ]
        
        for key in keys_to_delete:
            del self._cache_store[key]
        
        count = len(keys_to_delete)
        if count > 0:
            logger.info(f"Invalidated {count} cache items matching pattern: {pattern}")
        
        return count
    
    def get_stats(self) -> dict[str, Any]:
        """
        获取缓存统计信息
        
        Returns:
            统计字典(命中率/未命中率/缓存大小等)
        """
        total_requests = self._stats["hits"] + self._stats["misses"]
        hit_rate = (
            (self._stats["hits"] / total_requests * 100)
            if total_requests > 0 else 0.0
        )
        
        return {
            "enabled": self.enabled,
            "size": len(self._cache_store),
            "max_size": self.max_size,
            "hits": self._stats["hits"],
            "misses": self._stats["misses"],
            "hit_rate": f"{hit_rate:.2f}%",
            "evictions": self._stats["evictions"],
        }


# 全局单例实例
query_cache = QueryCacheService(
    default_ttl=300,  # 5分钟
    max_size=1000,    # 最多1000条缓存
    enabled=True,     # 启用缓存
)


__all__ = ["QueryCacheService", "query_cache"]
