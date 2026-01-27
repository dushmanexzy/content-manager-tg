# TG-App — Окружение и зависимости

## Технологический стек

| Слой | Технология | Версия |
|------|------------|--------|
| **Backend Framework** | NestJS | 11.0.1 |
| **Frontend Framework** | React | 19.2.0 |
| **Язык** | TypeScript | 5.7+ |
| **ORM** | Prisma | 7.1.0 |
| **База данных** | SQLite | - |
| **Сборка Frontend** | Vite | 7.2.4 |
| **Runtime** | Node.js | 18+ |
| **Package Manager** | npm | - |

---

## Backend зависимости

**Файл:** `backend/package.json`

### Production

| Пакет | Версия | Назначение |
|-------|--------|------------|
| @nestjs/common | ^11.0.1 | Core NestJS |
| @nestjs/core | ^11.0.1 | Core NestJS |
| @nestjs/jwt | ^11.0.2 | JWT авторизация |
| @nestjs/passport | ^11.0.5 | Passport.js интеграция |
| @nestjs/platform-express | ^11.0.1 | Express adapter |
| @nestjs/mapped-types | ^2.1.0 | DTO mapping |
| @prisma/client | ^7.1.0 | Prisma ORM client |
| passport | ^0.7.0 | Authentication middleware |
| passport-jwt | ^4.0.1 | JWT strategy |
| class-transformer | ^0.5.1 | Object transformation |
| class-validator | ^0.14.3 | DTO validation |
| reflect-metadata | ^0.2.2 | Metadata reflection |
| rxjs | ^7.8.1 | Reactive extensions |

### Development

| Пакет | Версия | Назначение |
|-------|--------|------------|
| @nestjs/cli | ^11.0.0 | CLI tools |
| @nestjs/schematics | ^11.0.0 | Code generation |
| @nestjs/testing | ^11.0.1 | Testing utilities |
| prisma | ^7.1.0 | Prisma CLI |
| typescript | ^5.7.3 | TypeScript compiler |
| ts-node | ^10.9.2 | TypeScript execution |
| jest | ^30.0.0 | Testing framework |
| ts-jest | ^29.2.5 | Jest TypeScript |
| supertest | ^7.0.0 | HTTP testing |
| eslint | ^9.18.0 | Linting |
| prettier | ^3.4.2 | Code formatting |

---

## Переменные окружения

### Backend (.env)

| Переменная | Обязательная | Описание | Пример |
|------------|--------------|----------|--------|
| DATABASE_URL | Да | Путь к SQLite БД | file:./prisma/dev.db |
| TELEGRAM_BOT_TOKEN | Да | Токен Telegram бота | 123456:ABC-DEF... |
| JWT_SECRET | Да | Секрет для подписи JWT | random-secret-key |
| MINI_APP_URL | Да | URL Mini App (для кнопок в боте) | https://example.com |
| PORT | Нет | Порт сервера (default: 3000) | 3000 |
| NODE_ENV | Нет | Окружение | development |
| TELEGRAM_API_URL | Нет | URL Telegram API (default: https://api.telegram.org) | https://api.telegram.org |
| TELEGRAM_BOT_USERNAME | Нет | Username бота для deep links | my_bot |

---

## Команды

### Backend

```bash
cd backend

# Установка зависимостей
npm install

# Инициализация базы данных
npx prisma migrate dev

# Генерация Prisma Client
npx prisma generate

# Запуск в dev режиме
npm run start:dev

# Запуск в prod режиме
npm run build
npm run start:prod

# Тесты
npm run test
npm run test:e2e
npm run test:cov

# Линтинг
npm run lint
npm run format
```

---

## Конфигурационные файлы

### Backend

| Файл | Назначение |
|------|------------|
| `nest-cli.json` | NestJS CLI конфигурация |
| `tsconfig.json` | TypeScript конфигурация |
| `tsconfig.build.json` | TypeScript для production |
| `eslint.config.mjs` | ESLint конфигурация |
| `.prettierrc` | Prettier конфигурация |
| `prisma/schema.prisma` | Схема базы данных |

---

## База данных

### SQLite
- Файл: `backend/prisma/dev.db`
- Миграции: `backend/prisma/migrations/`

### Prisma команды

```bash
# Создать миграцию
npx prisma migrate dev --name migration_name

# Применить миграции
npx prisma migrate deploy

# Сбросить БД
npx prisma migrate reset

# Открыть Prisma Studio
npx prisma studio

# Сгенерировать клиент
npx prisma generate
```

---

## Telegram Bot Setup

### 1. Создание бота
1. Написать @BotFather в Telegram
2. Команда `/newbot`
3. Указать имя и username
4. Получить токен

### 2. Настройка прав бота для групп

Бот должен иметь права для работы в группах:

```
@BotFather → /mybots → выбрать бота → Bot Settings → Group Privacy
→ Turn off (чтобы бот видел сообщения в группе, если нужно)
```

**Важно:** Для проверки прав участников бот использует `getChatMember`, для этого не требуется отключать Group Privacy.

### 3. Настройка webhook

```bash
# Установить webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/telegram/webhook"}'

# Проверить webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### 4. Настройка Mini App

1. @BotFather → `/mybots` → выбрать бота
2. Bot Settings → Menu Button
3. Configure menu button → указать URL Mini App

**Или через команды:**
```
/setmenubutton
```

### 5. Разрешения для групп

При добавлении бота в группу, он должен иметь права:
- Отправка сообщений
- Отправка медиа (для кнопок с web_app)

Администратор группы должен подтвердить добавление бота.

---

## Развёртывание

### Development

```bash
# Backend (порт 3000)
npm run start:dev
```

# Для тестирования Mini App локально используйте ngrok:
ngrok http 5173
```

### Production
**Backend:** любой Node.js хостинг (Railway, Render, VPS)

### Требования
- Node.js 18+
- HTTPS для webhook и Mini App
- Доступ к Telegram API (api.telegram.org)

---

## Тестирование Mini App в группе

### Локальная разработка

1. Запустите ngrok для frontend:
   ```bash
   ngrok http 5173
   ```

2. Обновите MINI_APP_URL в backend .env на ngrok URL

3. Настройте Menu Button в @BotFather на ngrok URL

4. Добавьте бота в тестовую группу

5. Откройте Mini App через кнопку в группе

### Отладка

- Используйте Telegram Desktop для просмотра console.log
- В мобильном Telegram: встряхните устройство для открытия debug меню
- Проверяйте initData в консоли браузера

---
