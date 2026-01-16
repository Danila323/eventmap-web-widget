"""
Модуль безопасности: JWT токены и хеширование паролей.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt

from app.core.config import get_settings

settings = get_settings()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверить пароль против хеша.

    Args:
        plain_password: Пароль в открытом виде
        hashed_password: Хешированный пароль

    Returns:
        True если пароли совпадают, иначе False
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """
    Получить хеш пароля.

    Args:
        password: Пароль в открытом виде

    Returns:
        Хешированный пароль
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Создать JWT токен доступа.

    Args:
        data: Данные для кодирования в токен
        expires_delta: Время жизни токена

    Returns:
        Закодированный JWT токен
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Декодировать JWT токен.

    Args:
        token: JWT токен

    Returns:
        Декодированные данные или None если токен невалидный
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        return None


def generate_api_key() -> str:
    """
    Сгенерировать уникальный API ключ.

    Returns:
        Уникальный API ключ
    """
    import secrets
    import string

    alphabet = string.ascii_letters + string.digits
    api_key = "emk_" + "".join(secrets.choice(alphabet) for _ in range(32))
    return api_key
