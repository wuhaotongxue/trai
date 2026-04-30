"""加密服务模块

提供 AES 加密/解密功能，用于存储敏感数据如邮箱密码等。
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from base64 import urlsafe_b64encode
import os
from typing import Optional

from core.exceptions import ConfigurationError


class EncryptionService:
    """AES 加密服务
    
    使用 Fernet 对称加密算法对敏感数据进行加密和解密。
    密钥从环境变量 ENCRYPTION_KEY 获取，必须在启动时设置。
    
    Fernet 特点：
    - 提供完整性校验
    - 提供认证
    - 使用 AES-128-CBC + HMAC-SHA256
    """
    
    _instance: Optional['EncryptionService'] = None
    _fernet: Optional[Fernet] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """初始化加密服务"""
        key_str = os.getenv("ENCRYPTION_KEY")
        if not key_str:
            raise ConfigurationError(
                message="ENCRYPTION_KEY 环境变量未设置, 无法初始化加密服务",
            )
        
        # 确保密钥长度足够, Fernet 需要 32 字节的密钥并进行 base64url 编码
        if len(key_str) < 32:
            # 如果密钥太短, 使用哈希扩展
            digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
            digest.update(key_str.encode('utf-8'))
            key_bytes = digest.finalize()
        else:
            key_bytes = key_str[:32].encode('utf-8')
        
        self._fernet = Fernet(urlsafe_b64encode(key_bytes))
    
    def encrypt(self, plaintext: str) -> str:
        """加密字符串
        
        Args:
            plaintext: 待加密的明文
        
        Returns:
            str: 加密后的 Base64 字符串
        """
        if not self._fernet:
            raise RuntimeError("加密服务未初始化")
        return self._fernet.encrypt(plaintext.encode('utf-8')).decode('utf-8')
    
    def decrypt(self, ciphertext: str) -> str:
        """解密字符串
        
        Args:
            ciphertext: 待解密的密文
        
        Returns:
            str: 解密后的明文
        
        Raises:
            ValueError: 解密失败时抛出
        """
        if not self._fernet:
            raise RuntimeError("加密服务未初始化")
        try:
            return self._fernet.decrypt(ciphertext.encode('utf-8')).decode('utf-8')
        except Exception as e:
            raise ValueError(f"解密失败: {str(e)}") from e


def get_encryption_service() -> EncryptionService:
    """获取加密服务实例（依赖注入）
    
    Returns:
        EncryptionService: 加密服务单例实例
    """
    return EncryptionService()