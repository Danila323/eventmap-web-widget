"""
Зависимости для аутентификации в API.
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_access_token
from app.schemas.user import TokenData

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Получить текущего пользователя из JWT токена.

    Args:
        credentials: HTTP Authorization credentials
        db: Сессия базы данных

    Returns:
        Объект пользователя

    Raises:
        HTTPException: Если токен невалидный или пользователь не найден
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Декодируем токен
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    user_id_str: Optional[str] = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    # Конвертируем строку в UUID для корректной работы с SQLite
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    # Получаем пользователя из базы
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Получить текущего активного пользователя.

    Args:
        current_user: Текущий пользователь

    Returns:
        Объект пользователя

    Raises:
        HTTPException: Если пользователь неактивен
    """
    # В будущем можно добавить поле is_active
    return current_user
