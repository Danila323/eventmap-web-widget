"""
API эндпоинт генерации embed кода.
Требует аутентификации.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.user import User
from app.models.widget_config import WidgetConfig
from app.schemas.widget import EmbedCodeResponse
from app.api.dependencies.auth import get_current_active_user
from app.services.embed_generator import embed_generator

router = APIRouter()


@router.post("/{config_id}", response_model=EmbedCodeResponse)
async def generate_embed_code(
    config_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Сгенерировать embed код для встраивания виджета.

    Требует JWT токен в заголовке Authorization.

    Возвращает HTML код, который можно скопировать и вставить на любой сайт.
    """
    # Получаем конфигурацию с загрузкой api_key relationship
    result = await db.execute(
        select(WidgetConfig)
        .options(selectinload(WidgetConfig.api_key))
        .where(
            WidgetConfig.id == config_id,
            WidgetConfig.user_id == current_user.id,
        )
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget config not found",
        )

    # Генерируем embed код
    embed_code = embed_generator.generate_embed_code(
        widget_key=config.api_key.key,
        width=config.width,
        height=config.height,
    )

    return EmbedCodeResponse(
        script_url=embed_generator.get_script_url(),
        embed_code=embed_code,
        preview_url=embed_generator.generate_preview_url(config.api_key.key),
    )
