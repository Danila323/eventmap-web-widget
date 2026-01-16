from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pydantic import field_validator
from typing import Any


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Event Map Widget"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    SERVER_URL: str = "http://localhost:8000"  # Base URL for embed codes

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # CORS - stored as string, parsed when needed
    _CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Yandex Maps
    YANDEX_MAPS_API_KEY: str = ""

    # Widget Cache TTL (seconds)
    WIDGET_CACHE_TTL: int = 300  # 5 minutes
    WIDGET_CONFIG_CACHE_TTL: int = 600  # 10 minutes

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD_SECONDS: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        populate_by_name=True,
        extra="ignore"
    )

    @property
    def CORS_ORIGINS(self) -> list[str]:
        """Parse CORS origins from string to list."""
        if isinstance(self._CORS_ORIGINS, str):
            return [x.strip() for x in self._CORS_ORIGINS.split(",")]
        return self._CORS_ORIGINS


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
