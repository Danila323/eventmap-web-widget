"""
Фикстуры для тестирования.
"""
import asyncio
import os
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock
import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.db.base import Base
from app.models.user import User
from app.models.api_key import ApiKey
from app.models.event import Event
from app.models.widget_config import WidgetConfig
from app.core.security import create_access_token, get_password_hash as hash_password
from app.core.config import get_settings

settings = get_settings()


def get_test_email() -> str:
    """Генерирует уникальный email для теста."""
    return f"test_{uuid.uuid4().hex[:8]}@example.com"

# Тестовая база данных (PostgreSQL)
TEST_DATABASE_URL = settings.DATABASE_URL


# Создаем тестовый engine
engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
)

# Создаем тестовый session maker
TestingSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=engine,
    class_=AsyncSession,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Создает новую сессию для каждого теста."""
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            # Закрываем сессию
            await session.close()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Создает тестовый HTTP клиент."""

    async def override_get_db():
        yield db_session

    from app.api.dependencies.auth import get_db
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data() -> dict:
    """Тестовые данные пользователя."""
    return {
        "email": get_test_email(),
        "password": "testpassword123",
        "name": "Test User",
    }


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession, test_user_data: dict) -> User:
    """Создает тестового пользователя в БД."""
    user = User(
        email=test_user_data["email"],
        password_hash=hash_password(test_user_data["password"]),
        name=test_user_data["name"],
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def test_user_token(test_user: User) -> str:
    """Создает JWT токен для тестового пользователя."""
    return create_access_token(data={"sub": str(test_user.id)})


@pytest.fixture
def auth_headers(test_user_token: str) -> dict:
    """Заголовки авторизации для запросов."""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def test_event_data() -> dict:
    """Тестовые данные события."""
    return {
        "title": "Test Event",
        "description": "Test Description",
        "event_datetime": "2026-12-31T19:00:00",
        "longitude": 37.6173,
        "latitude": 55.7558,
        "category": "concert",
        "venue_name": "Test Venue",
        "venue_address": "Moscow, Test Street 1",
        "image_url": "https://example.com/image.jpg",
        "ticket_url": "https://example.com/ticket",
        "is_published": True,
    }


@pytest_asyncio.fixture
async def test_event(db_session: AsyncSession, test_event_data: dict) -> Event:
    """Создает тестовое событие в БД."""
    event = Event(**test_event_data)
    db_session.add(event)
    await db_session.commit()
    await db_session.refresh(event)
    return event


@pytest.fixture
def test_widget_data() -> dict:
    """Тестовые данные виджета."""
    return {
        "title": "Test Widget",
        "width": "100%",
        "height": "400px",
        "primary_color": "#007bff",
        "marker_color": "#ff0000",
        "default_period": "all",
        "show_search": True,
        "show_filters": True,
        "show_categories": True,
        "auto_refresh": False,
        "zoom_level": 10,
        "center_lat": 55.7558,
        "center_lon": 37.6173,
    }


@pytest_asyncio.fixture
async def test_api_key(db_session: AsyncSession, test_user: User) -> ApiKey:
    """Создает тестовый API ключ."""
    import secrets

    api_key = ApiKey(
        key=f"emk_{secrets.token_urlsafe(32)}",
        name="Test API Key",
        user_id=test_user.id,
        usage_count=0,
    )
    db_session.add(api_key)
    await db_session.commit()
    await db_session.refresh(api_key)
    return api_key


@pytest_asyncio.fixture
async def test_widget(
    db_session: AsyncSession,
    test_user: User,
    test_api_key: ApiKey,
    test_widget_data: dict,
    test_event: Event,
) -> WidgetConfig:
    """Создает тестовый виджет."""
    widget = WidgetConfig(
        **test_widget_data,
        api_key_id=str(test_api_key.id),
        user_id=test_user.id,
        event_ids=[str(test_event.id)],
    )
    db_session.add(widget)
    await db_session.commit()
    await db_session.refresh(widget)
    return widget


# Mock для внешних сервисов
@pytest.fixture
def mock_yandex_geocoder(monkeypatch):
    """Мок для Yandex Geocoding API."""

    async def mock_geocode(address: str):
        from app.schemas.event import GeocodeResponse
        return GeocodeResponse(
            longitude=37.6173,
            latitude=55.7558,
            formatted_address=address,
        )

    from app.services.geocoder import YandexGeocoder
    monkeypatch.setattr("YandexGeocoder.geocode", staticmethod(mock_geocode))
    return mock_geocode


@pytest.fixture
def mock_redis(monkeypatch):
    """Мок для Redis клиента."""
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.delete = AsyncMock(return_value=1)
    mock_redis.exists = AsyncMock(return_value=False)
    return mock_redis
