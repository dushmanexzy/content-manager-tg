# Content Manager TG

Telegram Mini App для управления контентом в групповых чатах.

## Структура проекта

```
├── frontend/          # React + TypeScript + Vite
├── backend/           # NestJS + Prisma + SQLite
├── docs/              # Документация
└── mcp-telegram/      # MCP сервер для Telegram Bot API
```

## Возможности

- Авторизация через Telegram WebApp
- Иерархические разделы (неограниченная вложенность)
- Контент: текст, ссылки, изображения, файлы
- Глобальный поиск
- Уведомления в группу с deep links
- Права доступа (администратор/участник)
- Темная/светлая тема

## Требования

- Node.js 18+
- npm или yarn
- Telegram Bot Token

## Установка

### Backend

```bash
cd backend
npm install
cp .env.example .env  # настроить переменные
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # настроить переменные
npm run dev
```

## Переменные окружения

### Backend (.env)

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_BOT_USERNAME="your_bot_username"
MINI_APP_URL="https://your-app-url.com"
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
```

## Разработка

Backend запускается на `http://localhost:3000`
Frontend запускается на `http://localhost:5173`

Для тестирования через ngrok:
1. Запустить ngrok: `ngrok http 5173`
2. Обновить `MINI_APP_URL` в backend/.env
3. Установить webhook: `POST /telegram/webhook/set`

## Лицензия

MIT
