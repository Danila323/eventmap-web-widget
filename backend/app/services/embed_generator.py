"""
Сервис генерации embed кода для встраивания виджета.
"""
from typing import Optional
from app.core.config import get_settings

settings = get_settings()


class EmbedCodeGenerator:
    """Генератор embed кода для виджета."""

    @staticmethod
    def generate_embed_code(
        widget_key: str,
        width: Optional[str] = None,
        height: Optional[str] = None,
        container_id: Optional[str] = None,
    ) -> str:
        """
        Сгенерировать HTML код для встраивания виджета.

        Args:
            widget_key: API ключ виджета
            width: Ширина виджета (опционально) - ИГНОРИРУЕТСЯ, настройки берутся с сервера
            height: Высота виджета (опционально) - ИГНОРИРУЕТСЯ, настройки берутся с сервера
            container_id: ID контейнера (опционально)

        Returns:
            HTML код для встраивания
        """
        container_id = container_id or f"eventmap-widget-{widget_key[:8]}"

        # Генерируем HTML код - настройки загружаются с сервера
        script_url = f"{settings.SERVER_URL}{settings.API_PREFIX}/v1/widget.js"
        embed_code = f'''<!-- Event Map Widget -->
<script src="{script_url}" data-widget-key="{widget_key}" data-container="{container_id}"></script>'''

        return embed_code

    @staticmethod
    def get_script_url() -> str:
        """
        Получить URL JavaScript файла виджета.

        Returns:
            URL скрипта виджета
        """
        return f"{settings.SERVER_URL}{settings.API_PREFIX}/v1/widget.js"

    @staticmethod
    def generate_preview_url(widget_key: str) -> str:
        """
        Сгенерировать URL для предпросмотра виджета.

        Args:
            widget_key: API ключ виджета

        Returns:
            URL страницы предпросмотра
        """
        return f"{settings.SERVER_URL}/preview/{widget_key}"


# Глобальный экземпляр
embed_generator = EmbedCodeGenerator()
