"""
Публичный API виджета.
Не требует аутентификации.
"""
from typing import Optional
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.api_key import ApiKey
from app.schemas.widget import WidgetDataResponse, WidgetConfigResponse
from app.services.widget_cache import get_widget_cache_service
from app.services.widget_styles import widget_styles_generator

router = APIRouter()


def extract_domain(origin: Optional[str], referer: Optional[str]) -> Optional[str]:
    """Извлечь домен из Origin или Referer заголовка."""
    if origin:
        # Origin: https://example.com
        return urlparse(origin).netloc
    if referer:
        # Referer: https://example.com/page
        return urlparse(referer).netloc
    return None


def is_domain_allowed(request_domain: str, allowed_domains: Optional[list]) -> bool:
    """
    Проверить, разрешён ли домен.

    - Если allowed_domains пустой или None - разрешены все домены
    - Иначе проверяем точное совпадение или wildcard (*.example.com)
    """
    if not allowed_domains:
        return True  # Пустой список = все домены разрешены

    request_domain_lower = request_domain.lower()

    for allowed in allowed_domains:
        allowed_lower = allowed.lower()

        # Точное совпадение
        if request_domain_lower == allowed_lower:
            return True

        # Wildcard: *.example.com
        if allowed_lower.startswith("*."):
            base_domain = allowed_lower[2:]  # Убираем *.
            if request_domain_lower == base_domain or request_domain_lower.endswith(f".{base_domain}"):
                return True

    return False


@router.get("/{widget_key}", response_model=WidgetDataResponse)
async def get_widget_data(
    widget_key: str,
    request: Request,
    period: Optional[str] = Query(None, description="Фильтр по периоду: today, tomorrow, week, month, all"),
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    search: Optional[str] = Query(None, description="Поиск по названию и описанию"),
    date_from: Optional[str] = Query(None, description="Начальная дата (ISO 8601)"),
    date_to: Optional[str] = Query(None, description="Конечная дата (ISO 8601)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Получить данные виджета (публичный эндпоинт).

    Этот эндпоинт не требует аутентификации и используется встраиваемым виджетом.

    - **widget_key**: API ключ виджета
    - **period**: Фильтр по периоду (today, tomorrow, week, month, all)
    - **category**: Фильтр по категории событий
    - **search**: Поиск по названию и описанию
    - **date_from**: Начальная дата для фильтрации (ISO 8601)
    - **date_to**: Конечная дата для фильтрации (ISO 8601)

    Возвращает конфигурацию виджета и отфильтрованный список событий.
    Данные кэшируются в Redis на 5 минут.
    """
    cache_service = get_widget_cache_service()

    # Проверяем API ключ и получаем конфигурацию
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key == widget_key,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found or inactive",
        )

    # Проверяем белый список доменов из API ключа
    if api_key.allowed_domains:
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        request_domain = extract_domain(origin, referer)

        if request_domain and not is_domain_allowed(request_domain, api_key.allowed_domains):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Domain {request_domain} is not allowed for this widget",
            )

    # Обновляем счётчик использования и время последнего использования
    from datetime import datetime
    api_key.usage_count += 1
    api_key.last_used_at = datetime.utcnow()
    await db.commit()

    # Формируем ключ кэша с учетом параметров фильтрации
    cache_key_suffix = f"{widget_key}:{period}:{category}:{search}:{date_from}:{date_to}"
    cached_data = await cache_service.get_widget_data(cache_key_suffix)

    if cached_data:
        return cached_data

    # Нет в кэше - загружаем из базы
    widget_data = await cache_service.build_widget_data(
        db=db,
        api_key=api_key,
        period=period,
        category=category,
        search=search,
        date_from=date_from,
        date_to=date_to,
    )

    if not widget_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget configuration not found",
        )

    # Сохраняем в кэш
    await cache_service.set_widget_data(cache_key_suffix, widget_data)

    return widget_data


@router.get("/{widget_key}/config", response_model=WidgetConfigResponse)
async def get_widget_config(
    widget_key: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Получить настройки виджета (без событий).

    Этот эндпоинт возвращает только конфигурацию виджета.
    Используется для инициализации виджета на клиенте.
    """
    from app.models.widget_config import WidgetConfig
    from sqlalchemy.orm import selectinload

    # Проверяем API ключ
    result = await db.execute(
        select(ApiKey).where(
            ApiKey.key == widget_key,
        )
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget not found or inactive",
        )

    # Проверяем белый список доменов
    if api_key.allowed_domains:
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        request_domain = extract_domain(origin, referer)

        if request_domain and not is_domain_allowed(request_domain, api_key.allowed_domains):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Domain {request_domain} is not allowed",
            )

    # Получаем конфигурацию виджета
    result = await db.execute(
        select(WidgetConfig)
        .options(selectinload(WidgetConfig.api_key), selectinload(WidgetConfig.events))
        .where(
            WidgetConfig.api_key_id == api_key.id,
        )
        .order_by(WidgetConfig.created_at.desc())
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Widget configuration not found",
        )

    # Возвращаем конфигурацию
    return WidgetConfigResponse(
        id=str(config.id),
        user_id=str(config.user_id),
        api_key_id=str(config.api_key_id),
        title=config.title,
        width=config.width,
        height=config.height,
        primary_color=config.primary_color,
        marker_color=config.marker_color,
        default_period=config.default_period,
        show_search=config.show_search,
        show_filters=config.show_filters,
        show_categories=config.show_categories,
        auto_refresh=config.auto_refresh,
        zoom_level=config.zoom_level,
        center_lat=config.center_lat,
        center_lon=config.center_lon,
        created_at=config.created_at,
        updated_at=config.updated_at,
        event_ids=[str(e.id) for e in config.events],
        css=widget_styles_generator.generate_widget_css(config),
    )
