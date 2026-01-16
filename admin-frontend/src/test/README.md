# Тесты Frontend

## Структура

```
src/
├── test/
│   ├── setup.ts          # Глобальная конфигурация vitest
│   ├── utils.tsx         # Тестовые утилиты и custom render
│   └── README.md         # Этот файл
├── components/
│   └── __tests__/        # Тесты компонентов
├── services/
│   └── __tests__/        # Тесты API сервисов
└── types/
    └── __tests__/        # Тесты типов
```

## Запуск тестов

### Все тесты
```bash
npm test
```

### С UI интерфейсом
```bash
npm run test:ui
```

### С покрытием (coverage)
```bash
npm run test:coverage
```

### Конкретный файл
```bash
npm test ProtectedRoute.test.tsx
```

### Watch режим
```bash
npm test -- --watch
```

## Что покрыто тестами

### Компоненты
- ✅ ProtectedRoute (базовый тест)
- 🔄 Другие компоненты (в разработке)

### Сервисы
- ✅ API сервис (базовый тест)
- 🔄 Auth, Events, Widgets сервисы (в разработке)

### Типы
- ✅ Event типы
- 🔄 Widget, ApiKey типы (в разработке)

## Что нужно добавить

### Компоненты
- [ ] MainLayout
- [ ] EventForm
- [ ] WidgetForm
- [ ] AddressPicker
- [ ] EmbedCodeModal
- [ ] WidgetPreview

### Страницы
- [ ] Login
- [ ] Register
- [ ] Events List/Create/Edit
- [ ] Widgets List/Create/Edit
- [ ] API Keys List

### Сервисы
- [ ] authService
- [ ] eventsService
- [ ] widgetsService
- [ ] apiKeysService

## Тестовые утилиты

### customRender
Эквивалент стандартного `render` из `@testing-library/react`, но с провайдерами:
- `BrowserRouter` - для роутинга
- `QueryClientProvider` - для React Query

```tsx
import { render, screen } from '@/test/utils';

test('пример', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Mock для AuthContext
```tsx
import { vi } from 'vitest';

const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));
```
