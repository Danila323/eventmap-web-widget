"""
Middleware для rate limiting с использованием Redis.
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import redis.asyncio as redis

from app.core.config import get_settings

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware для rate limiting на основе Redis."""

    def __init__(self, app, redis_url: str):
        super().__init__(app)
        self.redis_url = redis_url
        self.redis_client = None

    async def dispatch(self, request: Request, call_next):
        """Обработка запроса с проверкой rate limit."""

        # Пропускаем health check
        if request.url.path == "/health":
            return await call_next(request)

        # Инициализируем Redis клиент если нужно
        if not self.redis_client:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )

        # Получаем идентификатор для rate limiting
        client_id = await self._get_client_id(request)

        # Проверяем rate limit
        allowed, retry_after = await self._check_rate_limit(client_id)

        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Rate limit exceeded",
                    "retry_after": retry_after,
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(settings.RATE_LIMIT_REQUESTS),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(retry_after),
                },
            )

        response = await call_next(request)

        # Добавляем заголовки rate limit
        remaining = await self._get_remaining_requests(client_id)
        response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_REQUESTS)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response

    async def _get_client_id(self, request: Request) -> str:
        """
        Получить уникальный идентификатор клиента для rate limiting.

        Для публичных API виджета используем API ключ + IP.
        Для остальных - только IP.
        """
        # Получаем IP адрес
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        # Для API виджета используем widget_key если есть
        if "/api/widget/" in request.url.path:
            # Извлекаем widget_key из пути
            parts = request.url.path.split("/")
            if len(parts) > 3:  # /api/widget/{key}
                widget_key = parts[3]
                return f"widget:{widget_key}:{ip}"

        return f"global:{ip}"

    async def _check_rate_limit(self, client_id: str) -> tuple[bool, int]:
        """
        Проверить rate limit для клиента.

        Returns:
            Кортеж (allowed: bool, retry_after: int)
        """
        if not self.redis_client:
            return True, 0

        try:
            # Увеличиваем счетчик
            current = await self.redis_client.incr(client_id)

            # Устанавливаем время жизни при первом запросе
            if current == 1:
                await self.redis_client.expire(client_id, settings.RATE_LIMIT_PERIOD_SECONDS)

            # Проверяем лимит
            if current > settings.RATE_LIMIT_REQUESTS:
                ttl = await self.redis_client.ttl(client_id)
                return False, ttl

            return True, 0

        except Exception:
            # При ошибке Redis разрешаем запрос
            return True, 0

    async def _get_remaining_requests(self, client_id: str) -> int:
        """Получить оставшееся количество запросов."""
        if not self.redis_client:
            return settings.RATE_LIMIT_REQUESTS

        try:
            current = await self.redis_client.get(client_id)
            if current:
                return max(0, settings.RATE_LIMIT_REQUESTS - int(current))
            return settings.RATE_LIMIT_REQUESTS
        except Exception:
            return settings.RATE_LIMIT_REQUESTS


# Альтернативная функция для использования в роутах
async def check_rate_limit(
    redis_client: redis.Redis,
    key: str,
    limit: int,
    period: int,
) -> tuple[bool, int]:
    """
    Проверить rate limit для конкретного ключа.

    Args:
        redis_client: Redis клиент
        key: Ключ для rate limiting
        limit: Лимит запросов
        period: Период в секундах

    Returns:
        Кортеж (allowed: bool, retry_after: int)
    """
    try:
        current = await redis_client.incr(key)

        if current == 1:
            await redis_client.expire(key, period)

        if current > limit:
            ttl = await redis_client.ttl(key)
            return False, ttl

        return True, 0

    except Exception:
        return True, 0
