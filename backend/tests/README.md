# Тесты Backend

## Структура

```
tests/
├── conftest.py          # Фикстуры и общая конфигурация
├── api/                 # Тесты API endpoints
│   ├── test_auth.py     # Тесты аутентификации
│   ├── test_events.py   # Тесты событий
│   ├── test_widgets.py  # Тесты виджетов
│   └── test_api_keys.py # Тесты API ключей
└── services/            # Тесты сервисов (в разработке)
```

## Запуск тестов

### Все тесты
```bash
pytest
```

### С覆盖率
```bash
pytest --cov=app --cov-report=html
```

### Конкретный файл
```bash
pytest tests/api/test_auth.py
```

### Конкретный тест
```bash
pytest tests/api/test_auth.py::TestAuthRegister::test_register_success
```

### Только быстрый тесты
```bash
pytest -m "not integration"
```

## Что покрыто тестами

### API Endpoints
- ✅ Регистрация пользователей
- ✅ Вход в систему
- ✅ Получение текущего пользователя
- ✅ CRUD операции для событий
- ✅ CRUD операции для виджетов
- ✅ CRUD операции для API ключей
- ✅ Генерация embed кода

### Что нужно добавить
- [ ] Тесты для сервисов (geocoder, embed_generator, etc.)
- [ ] Тесты для middleware
- [ ] Интеграционные тесты
- [ ] Тесты для публичного widget API

## Фикстуры

Доступные фикстуры в `conftest.py`:

- `db_session` - Временная БД для каждого теста
- `client` - HTTP клиент для запросов
- `test_user` - Тестовый пользователь
- `test_user_token` - JWT токен для тестового пользователя
- `auth_headers` - Заголовки авторизации
- `test_event` - Тестовое событие
- `test_api_key` - Тестовый API ключ
- `test_widget` - Тестовый виджет
- `mock_yandex_geocoder` - Мок для Yandex Geocoding API
- `mock_redis` - Мок для Redis
