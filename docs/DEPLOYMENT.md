# Deployment Guide

## Текущая инфраструктура

| Компонент | URL / Расположение |
|-----------|-------------------|
| Frontend | https://app.exzyz.org |
| Backend API | https://api.exzyz.org |
| Telegram бот | @my_content_master_bot |
| VPS | 185.130.212.192 (Hostkey, Ubuntu 24.04) |
| Домен | exzyz.org (Cloudflare) |

## Автоматический деплой

При пуше в `main` ветку GitHub Actions автоматически:
1. Подключается к VPS по SSH
2. Пулит изменения
3. Устанавливает зависимости
4. Генерирует Prisma client
5. Применяет миграции
6. Собирает backend и frontend
7. Перезапускает PM2

### GitHub Secrets

Необходимые секреты в Settings → Secrets → Actions:

| Secret | Описание |
|--------|----------|
| `VPS_HOST` | IP адрес сервера |
| `VPS_USER` | Пользователь SSH (root) |
| `VPS_SSH_KEY` | Приватный SSH ключ |
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| `JWT_SECRET` | Секрет для JWT токенов |

## Ручной деплой

### Подключение к серверу

```bash
ssh root@185.130.212.192
```

### Обновление кода

```bash
cd /var/www/tg-app
git pull origin main
```

### Backend

```bash
cd /var/www/tg-app/backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart tg-backend
```

### Frontend

```bash
cd /var/www/tg-app/frontend
npm ci
npm run build
rm -rf /var/www/tg-app-frontend
cp -r dist /var/www/tg-app-frontend
```

## Конфигурация сервера

### Структура файлов

```
/var/www/
├── tg-app/                    # Git репозиторий
│   ├── backend/
│   │   ├── .env               # Переменные окружения (не в git)
│   │   ├── prisma/
│   │   │   └── prod.db        # SQLite база данных
│   │   └── dist/              # Собранный backend
│   └── frontend/
│       └── dist/              # Собранный frontend
└── tg-app-frontend/           # Статика для nginx
```

### Backend .env

```env
DATABASE_URL="file:./prisma/prod.db"
TELEGRAM_BOT_TOKEN="токен_бота"
TELEGRAM_BOT_USERNAME="my_content_master_bot"
JWT_SECRET="секретный_ключ"
MINI_APP_URL="https://app.exzyz.org"
NODE_ENV="production"
PORT=3000
```

### Nginx

Конфиг: `/etc/nginx/sites-available/tg-app`

```nginx
# Frontend - app.exzyz.org
server {
    listen 443 ssl;
    server_name app.exzyz.org;

    root /var/www/tg-app-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # SSL сертификаты (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/app.exzyz.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.exzyz.org/privkey.pem;
}

# Backend API - api.exzyz.org
server {
    listen 443 ssl;
    server_name api.exzyz.org;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }

    ssl_certificate /etc/letsencrypt/live/app.exzyz.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.exzyz.org/privkey.pem;
}
```

### PM2

```bash
# Статус
pm2 status

# Логи
pm2 logs tg-backend

# Перезапуск
pm2 restart tg-backend

# Сохранить конфиг (для автозапуска)
pm2 save
```

### SSL сертификаты

Автообновление через certbot (уже настроено):

```bash
# Проверить статус
certbot certificates

# Принудительное обновление
certbot renew --force-renewal
```

## Telegram бот

### Настройка в @BotFather

1. Mini App URL: `https://app.exzyz.org`
2. Mini App Short Name: `app`
3. Menu Button URL: `https://app.exzyz.org`

### Webhook

```bash
# Установить webhook
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://api.exzyz.org/telegram/webhook"

# Проверить webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## Мониторинг

### Проверка работоспособности

```bash
# Backend health
curl https://api.exzyz.org/health

# Frontend
curl -I https://app.exzyz.org
```

### Логи

```bash
# PM2 логи backend
pm2 logs tg-backend --lines 100

# Nginx логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Ресурсы сервера

```bash
# Память и swap
free -h

# Диск
df -h

# Процессы
htop
```

## Troubleshooting

### Backend не запускается

```bash
# Проверить логи
pm2 logs tg-backend --lines 50

# Проверить .env
cat /var/www/tg-app/backend/.env

# Перегенерировать Prisma
cd /var/www/tg-app/backend
npx prisma generate
npm run build
pm2 restart tg-backend
```

### 502 Bad Gateway

1. Проверить что backend запущен: `pm2 status`
2. Проверить логи: `pm2 logs tg-backend`
3. Проверить порт: `curl http://localhost:3000/health`

### Деплой по таймауту

VPS имеет 1GB RAM. При нехватке памяти:

```bash
# Проверить swap
free -h

# Если swap нет — добавить
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Telegram webhook ошибки

```bash
# Проверить webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Посмотреть last_error_message в ответе
# Проверить логи backend на ошибки
```

## Бэкапы

### База данных

```bash
# Создать бэкап
cp /var/www/tg-app/backend/prisma/prod.db ~/backups/prod_$(date +%Y%m%d).db

# Восстановить
cp ~/backups/prod_YYYYMMDD.db /var/www/tg-app/backend/prisma/prod.db
pm2 restart tg-backend
```

### Автоматический бэкап (cron)

```bash
# Добавить в crontab -e
0 3 * * * cp /var/www/tg-app/backend/prisma/prod.db /root/backups/prod_$(date +\%Y\%m\%d).db
```
