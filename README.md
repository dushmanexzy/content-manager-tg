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
- npm
- Telegram Bot Token (создать через @BotFather)
- cloudflared (для мобильного тестирования)

## Быстрый старт

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env  # настроить переменные
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Открыть в браузере

`http://localhost:5173` — откроется в mock-режиме с тестовым пользователем.

---

## Тестирование

### Локальное (Desktop Telegram или браузер)

1. Запустить backend: `npm run start:dev` (порт 3000)
2. Запустить frontend: `npm run dev` (порт 5173)
3. Открыть `http://localhost:5173` — mock-режим
4. Или открыть через Telegram Desktop: `t.me/YOUR_BOT/app`

### Мобильное тестирование (iOS/Android)

Для мобильного тестирования нужны публичные URL, т.к. телефон не имеет доступа к localhost.

#### Установка cloudflared

```bash
# Windows (winget)
winget install cloudflare.cloudflared

# macOS
brew install cloudflared

# Linux
# См. https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

#### Запуск туннелей

**Терминал 1 — Backend туннель:**
```bash
cloudflared tunnel --url http://localhost:3000
```
Скопировать URL вида `https://xxx-xxx.trycloudflare.com`

**Терминал 2 — Frontend туннель:**
```bash
cloudflared tunnel --url http://localhost:5173
```
Скопировать URL вида `https://yyy-yyy.trycloudflare.com`

#### Настройка

1. **Frontend .env** — указать URL бэкенд-туннеля:
   ```
   VITE_API_URL=https://xxx-xxx.trycloudflare.com
   ```

2. **Frontend vite.config.ts** — добавить хост в allowedHosts:
   ```typescript
   server: {
     allowedHosts: ['yyy-yyy.trycloudflare.com'],
     // ...
   }
   ```

3. **Backend .env** — обновить MINI_APP_URL:
   ```
   MINI_APP_URL=https://yyy-yyy.trycloudflare.com
   ```

4. **Перезапустить frontend** (для применения .env):
   ```bash
   # Ctrl+C и снова
   npm run dev
   ```

5. **Установить webhook** через BotFather или API:
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://xxx-xxx.trycloudflare.com/telegram/webhook
   ```

6. **Настроить Mini App URL в BotFather:**
   - /mybots → выбрать бота → Bot Settings → Menu Button → Edit Menu Button URL
   - Указать: `https://yyy-yyy.trycloudflare.com`

#### Открыть на мобиле

`t.me/YOUR_BOT/app` или через кнопку меню бота.

---

## Переменные окружения

### Backend (.env)

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_BOT_USERNAME="your_bot_username"
MINI_APP_URL="https://your-frontend-url.com"
```

### Frontend (.env)

```bash
# Для мобильного тестирования — URL бэкенд-туннеля
# Для локальной разработки — можно не указывать (используется Vite proxy)
VITE_API_URL=https://backend-tunnel.trycloudflare.com
```

**Примечание:** На localhost фронтенд автоматически использует Vite proxy (пустой VITE_API_URL). На внешних хостах (cloudflared, production) использует значение из VITE_API_URL.

---

## Production

Приложение развёрнуто на VPS:

| Компонент | URL |
|-----------|-----|
| Frontend | https://app.exzyz.org |
| Backend | https://api.exzyz.org |
| Telegram бот | @my_content_master_bot |

**Автодеплой:** При пуше в `main` запускается GitHub Actions.

Подробнее в [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## Архитектура

- **Frontend:** React 19, TypeScript, Vite, CSS Modules
- **Backend:** NestJS 11, Prisma ORM, SQLite, JWT
- **API:** REST, авторизация через Telegram initData

Подробнее в [docs/](./docs/).

---

## Troubleshooting

### "Load failed" на мобиле

- Проверить, что оба туннеля (frontend + backend) запущены
- Проверить VITE_API_URL в frontend/.env
- Перезапустить frontend после изменения .env

### "Chat data not found"

- Mini App должен открываться из группы с ботом
- Или через ссылку с параметром startapp (chatId)

### Приложение сворачивается при свайпе

- Отключено через `disableVerticalSwipes()` — закрыть можно только кнопкой Telegram

---

## Лицензия

MIT
