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

## Frontend зависимости

**Файл:** `frontend/package.json`

### Production

| Пакет | Версия | Назначение |
|-------|--------|------------|
| react | ^19.2.0 | UI library |
| react-dom | ^19.2.0 | React DOM |
| @telegram-apps/sdk-react | ^3.3.9 | Telegram Mini App SDK |

### Development

| Пакет | Версия | Назначение |
|-------|--------|------------|
| vite | ^7.2.4 | Build tool |
| @vitejs/plugin-react | ^5.1.1 | Vite React plugin |
| typescript | ~5.9.3 | TypeScript compiler |
| @types/react | ^19.2.5 | React types |
| @types/react-dom | ^19.2.3 | React DOM types |
| @types/node | ^24.10.1 | Node.js types |
| eslint | ^9.39.1 | Linting |
| typescript-eslint | ^8.46.4 | ESLint TypeScript |

---

## Переменные окружения

### Frontend (.env)

| Переменная | Обязательная | Описание | Пример |
|------------|--------------|----------|--------|
| VITE_API_URL | Нет | URL бэкенда (default: localhost:3000) | https://api.example.com |

---

## Команды

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для production
npm run build

# Preview production build
npm run preview

# Линтинг
npm run lint
```

---

## Конфигурационные файлы

### Frontend

| Файл | Назначение |
|------|------------|
| `vite.config.ts` | Vite конфигурация |
| `tsconfig.json` | TypeScript base config |
| `tsconfig.app.json` | TypeScript app config |
| `tsconfig.node.json` | TypeScript node config |
| `eslint.config.js` | ESLint конфигурация |
| `index.html` | HTML template |

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

# Frontend (порт 5173)
npm run dev

### Production
**Frontend:** статический хостинг (Vercel, Netlify, Cloudflare Pages)

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
