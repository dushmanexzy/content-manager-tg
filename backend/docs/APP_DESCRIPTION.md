# TG-App - Бэкенд-сервис Telegram-бота

## Обзор

TG-App — это бэкенд-сервис Telegram-бота с Mini App, построенный на NestJS и TypeScript. Приложение обеспечивает управление пользователями, организацию контента и интеграцию с Telegram.

## Технологический стек

### Backend
| Компонент | Технология |
|-----------|------------|
| Фреймворк | NestJS 11.0.1 |
| Язык | TypeScript 5.7.3 |
| База данных | SQLite (Prisma ORM 7.1.0) |
| Аутентификация | JWT + Passport |
| Тестирование | Jest 30.0.0 |

### Frontend (Telegram Mini App)
| Компонент | Технология |
|-----------|------------|
| Сборка | Vite |
| Фреймворк | React + TypeScript |
| Telegram SDK | telegram-web-app.js |

## Основные функции

### 1. Telegram-бот
- Команды: `/start`, `/help`, `/sections`
- Inline-клавиатура для навигации
- Кнопка открытия Mini App
- Автоматическое создание профиля пользователя

### 2. Telegram Mini App
- Просмотр списка разделов
- Создание новых разделов
- Интеграция с Telegram UI (MainButton, тёмная тема)
- Авторизация через initData

### 3. Управление пользователями
- Хранение профилей Telegram-пользователей
- JWT авторизация для API

### 4. Разделы контента
- Разделы по умолчанию: Документы, Финансы, Досуг, Путешествия
- CRUD операции для разделов

## API Эндпоинты

### Публичные
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/` | Проверка работоспособности |
| `GET` | `/health` | Статус сервиса |
| `POST` | `/telegram/webhook` | Вебхук Telegram |
| `POST` | `/auth/telegram` | Авторизация через initData |

### Защищённые (требуют JWT)
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/me` | Текущий пользователь |
| `GET` | `/api/sections` | Список разделов |
| `POST` | `/api/sections` | Создать раздел |
| `PATCH` | `/api/sections/:id` | Обновить раздел |
| `DELETE` | `/api/sections/:id` | Удалить раздел |

## Структура проекта

```
tg-app/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/           # JWT авторизация
│   │   ├── api/            # Защищённые эндпоинты
│   │   ├── prisma/         # Слой базы данных
│   │   ├── telegram/       # Интеграция с ботом
│   │   ├── user/           # Управление пользователями
│   │   └── sections/       # Управление разделами
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/            # API клиент
│   │   ├── hooks/          # useTelegram хук
│   │   ├── components/     # React компоненты
│   │   └── types/          # TypeScript типы
│   └── index.html
└── APP_DESCRIPTION.md
```

## Запуск

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Переменные окружения

### Backend (.env)
| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | Путь к SQLite БД |
| `TELEGRAM_BOT_TOKEN` | Токен бота |
| `JWT_SECRET` | Секрет для JWT |
| `MINI_APP_URL` | URL Mini App |

### Frontend (.env)
| Переменная | Описание |
|------------|----------|
| `VITE_API_URL` | URL бэкенда |

## Дальнейшее развитие

- [ ] Добавить содержимое в разделы
- [ ] Интеграция с облачным хранилищем
- [ ] Push-уведомления
- [ ] Экспорт данных
- [ ] Группы и совместный доступ
