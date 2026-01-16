"""
API эндпоинты управления API ключами.
Требуют аутентификации.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.user import User
from app.models.api_key import ApiKey
from app.schemas.api_key import ApiKeyCreate, ApiKeyUpdate, ApiKeyResponse
from app.api.dependencies.auth import get_current_active_user
from app.core.security import generate_api_key

router = APIRouter()


async def generate_default_name(db: AsyncSession, user_id: str) -> str:
    """Генерировать имя по умолчанию (API Key 1, API Key 2, ...)"""
    result = await db.execute(
        select(func.count(ApiKey.id))
        .where(ApiKey.user_id == user_id)
    )
    count = result.scalar() or 0
    return f"API Key {count + 1}"


@router.post("", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: ApiKeyCreate = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Создать новый API ключ.

    Требует JWT токен в заголовке Authorization.
    Имя генерируется автоматически если не указано.
    """
    # Генерируем уникальный ключ
    new_key = generate_api_key()

    # Проверяем уникальность
    result = await db.execute(select(ApiKey).where(ApiKey.key == new_key))
    existing = result.scalar_one_or_none()

    # Если ключ уже существует (маловероятно), генерируем новый
    while existing:
        new_key = generate_api_key()
        result = await db.execute(select(ApiKey).where(ApiKey.key == new_key))
        existing = result.scalar_one_or_none()

    # Генерируем имя если не указано
    name = data.name if data and data.name else await generate_default_name(db, current_user.id)

    # Создаем API ключ
    api_key = ApiKey(
        user_id=current_user.id,
        key=new_key,
        name=name,
        allowed_domains=data.allowed_domains if data else None,
    )

    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return api_key


@router.get("", response_model=list[ApiKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить список всех API ключей пользователя.

    Требует JWT токен в заголовке Authorization.
    """
    result = await db.execute(
        select(ApiKey)
        .where(ApiKey.user_id == current_user.id)
        .order_by(ApiKey.created_at.desc())
    )
    api_keys = result.scalars().all()

    return api_keys


@router.patch("/{key_id}", response_model=ApiKeyResponse)
async def update_api_key(
    key_id: str,
    data: ApiKeyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Обновить API ключ (имя и домены).

    Требует JWT токен. Пользователь может обновлять только свои ключи.
    """
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.id == key_id,
            ApiKey.user_id == current_user.id,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    # Обновляем поля
    if data.name is not None:
        api_key.name = data.name
    if data.allowed_domains is not None:
        api_key.allowed_domains = data.allowed_domains

    await db.commit()
    await db.refresh(api_key)

    return api_key


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Удалить API ключ.

    Требует JWT токен. Пользователь может удалять только свои ключи.
    """
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.id == key_id,
            ApiKey.user_id == current_user.id,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    await db.delete(api_key)
    await db.commit()
