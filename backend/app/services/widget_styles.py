"""
Сервис генерации CSS стилей для виджета.
"""


class WidgetStylesGenerator:
    """Генератор CSS стилей для виджета на основе конфигурации."""

    @staticmethod
    def generate_widget_css(config) -> str:
        """
        Сгенерировать CSS стили для виджета.

        Args:
            config: Конфигурация виджета (модель или словарь)

        Returns:
            CSS строка для применения в виджете
        """
        # Получаем значения из конфигурации
        if hasattr(config, 'title'):
            # Модель SQLAlchemy
            title = config.title or 'Мероприятия'
            width = config.width or '100%'
            height = config.height or '400px'
            primary_color = config.primary_color or '#007bff'
            show_search = config.show_search
            show_filters = config.show_filters
            show_categories = config.show_categories
        else:
            # Словарь
            title = config.get('title', 'Мероприятия')
            width = config.get('width', '100%')
            height = config.get('height', '400px')
            primary_color = config.get('primary_color', '#007bff')
            show_search = config.get('show_search', True)
            show_filters = config.get('show_filters', True)
            show_categories = config.get('show_categories', True)

        # Вычисляем высоту карты
        height_value = WidgetStylesGenerator._parse_height(height)
        map_height = max(height_value - 120, 150)

        # Генерируем CSS с плейсхолдером {widget-id}
        css = f"""
#{'{widget-id}'} {{
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  width: {width};
  height: {height};
  display: flex;
  flex-direction: column;
}}

#{'{widget-id}'} .eventmap-header {{
  padding: 12px 16px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
  background-color: {primary_color};
}}

#{'{widget-id}'} .eventmap-filters {{
  display: flex;
  gap: 8px;
  padding: 12px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}}

#{'{widget-id}'} .eventmap-filter-select {{
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}}

#{'{widget-id}'} .eventmap-filter-input {{
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}}

#{'{widget-id}'} .eventmap-filter-select:focus,
#{'{widget-id}'} .eventmap-filter-input:focus {{
  outline: none;
  border-color: {primary_color};
}}

#{'{widget-id}'} .eventmap-map {{
  width: 100%;
  height: 100%;
  min-height: {map_height}px;
  position: relative;
  flex: 1;
}}

#{'{widget-id}'} .eventmap-footer {{
  background: #f9fafb;
  padding: 8px 16px;
  font-size: 12px;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}}

#{'{widget-id}'} .eventmap-footer-features {{
  display: flex;
  gap: 8px;
}}
"""
        return css

    @staticmethod
    def _parse_height(height: str) -> int:
        """Парсит высоту типа '400px' в число."""
        import re
        match = re.match(r'(\d+)', height)
        return int(match.group(1)) if match else 400


# Глобальный экземпляр
widget_styles_generator = WidgetStylesGenerator()
