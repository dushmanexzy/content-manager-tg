# TG-App Backend — Архитектура

## Обзор

Backend построен на **NestJS 11** с использованием **TypeScript** и **Prisma ORM**. Архитектура модульная — каждый домен изолирован в отдельный модуль.

## Структура проекта

```
backend/
├── src/
│   ├── main.ts                 # Точка входа
│   ├── app.module.ts           # Корневой модуль
│   ├── app.controller.ts       # Healthcheck endpoints
│   │
│   ├── prisma/                 # Слой базы данных
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── auth/                   # Авторизация
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── permissions.guard.ts  # Проверка прав в группе
│   │
│   ├── user/                   # Пользователи
│   │   ├── user.module.ts
│   │   └── user.service.ts
│   │
│   ├── space/                  # Пространства (группы)
│   │   ├── space.module.ts
│   │   └── space.service.ts
│   │
│   ├── sections/               # Разделы
│   │   ├── sections.module.ts
│   │   ├── sections.controller.ts
│   │   ├── sections.service.ts
│   │   └── dto/
│   │
│   ├── items/                  # Контент
│   │   ├── items.module.ts
│   │   ├── items.controller.ts
│   │   ├── items.service.ts
│   │   └── dto/
│   │
│   ├── search/                 # Поиск
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   └── search.service.ts
│   │
│   ├── telegram/               # Telegram bot & API
│   │   ├── telegram.module.ts
│   │   ├── telegram.controller.ts
│   │   ├── telegram.service.ts
│   │   └── telegram-api.service.ts
│   │
│   └── api/                    # Защищённые endpoints
│       ├── api.module.ts
│       └── api.controller.ts
│
├── prisma/
│   ├── schema.prisma           # Схема базы данных
│   └── migrations/
│
└── test/
```

## Модули

### AppModule (root)
**Файл:** `src/app.module.ts`

Корневой модуль, импортирует все остальные:
```typescript
@Module({
  imports: [
    PrismaModule,
    UserModule,
    SpaceModule,
    SectionsModule,
    ItemsModule,
    SearchModule,
    TelegramModule,
    AuthModule,
    ApiModule,
  ],
})
```

### PrismaModule
**Файлы:** `src/prisma/`

- Обёртка над Prisma Client
- Singleton сервис для всего приложения
- Подключение к SQLite базе

### AuthModule
**Файлы:** `src/auth/`

**Ответственность:**
- Авторизация через Telegram initData
- Генерация и валидация JWT токенов
- Проверка прав через Telegram API

**Ключевые компоненты:**

**AuthService:**
- `authenticateWithTelegram(initData, chatId)` — авторизация, возвращает JWT и Space
- `verifyInitData(initData)` — проверка HMAC-SHA256 подписи

**PermissionsGuard:**
- Проверяет права пользователя в группе через `getChatMember`
- Возвращает роль: `owner`, `admin`, `member`, `restricted`, `left`, `kicked`

**Алгоритм верификации initData:**
1. Парсинг URL-encoded строки
2. Извлечение hash из параметров
3. Сортировка оставшихся параметров по алфавиту
4. Генерация secret key: HMAC-SHA256("WebAppData", BOT_TOKEN)
5. Вычисление hash: HMAC-SHA256(secret_key, sorted_params)
6. Сравнение с полученным hash

### UserModule
**Файлы:** `src/user/`

**Ответственность:**
- Кэширование данных пользователей из Telegram
- CRUD операции

**Ключевые методы:**
- `findById(id)` — поиск по внутреннему ID
- `findByTelegramId(telegramId)` — поиск по Telegram ID
- `findOrCreateByTelegram(payload)` — upsert пользователя

### SpaceModule
**Файлы:** `src/space/`

**Ответственность:**
- Управление пространствами (группами)
- Создание Space при первом открытии Mini App

**Ключевые методы:**
- `findByChatId(chatId)` — поиск по Telegram chat_id
- `findOrCreate(chatId, title?)` — upsert пространства

### SectionsModule
**Файлы:** `src/sections/`

**Ответственность:**
- CRUD для разделов с вложенностью
- Получение дерева разделов
- Навигация (хлебные крошки)

**Ключевые методы:**
- `getRootSections(spaceId)` — корневые разделы пространства
- `getChildren(parentId)` — дочерние разделы
- `getById(sectionId)` — раздел с детьми и контентом
- `getPath(sectionId)` — путь до раздела (хлебные крошки)
- `create(spaceId, dto, userId)` — создать раздел
- `update(sectionId, dto)` — обновить
- `delete(sectionId)` — удалить (каскадно с детьми и контентом)
- `move(sectionId, newParentId)` — переместить в другой раздел
- `belongsToSpace(sectionId, spaceId)` — проверка принадлежности
- `isCreatedBy(sectionId, userId)` — проверка авторства

### ItemsModule
**Файлы:** `src/items/`

**Ответственность:**
- CRUD для контента внутри разделов
- Загрузка файлов через Telegram

**Ключевые методы:**
- `getBySectionId(sectionId)` — контент раздела
- `getById(itemId)` — получить item по ID
- `create(sectionId, dto, userId)` — создать item
- `update(itemId, dto)` — обновить
- `delete(itemId)` — удалить
- `move(itemId, newSectionId)` — переместить в другой раздел
- `reorder(sectionId, itemIds)` — изменить порядок элементов
- `belongsToSpace(itemId, spaceId)` — проверка принадлежности
- `isCreatedBy(itemId, userId)` — проверка авторства

**Загрузка файлов:**
Файлы загружаются через `POST /api/sections/:sectionId/items/upload`:
1. Файл отправляется в Telegram группу (sendPhoto/sendDocument)
2. Telegram возвращает file_id
3. file_id сохраняется в БД
4. Для скачивания используется `GET /api/files/:fileId`

### SearchModule
**Файлы:** `src/search/`

**Ответственность:**
- Полнотекстовый поиск по разделам и контенту
- Быстрый поиск для автодополнения

**Ключевые методы:**
- `search(spaceId, query, limit)` — полный поиск с путями
- `quickSearch(spaceId, query, limit)` — быстрый поиск только по разделам

**Логика поиска:**
```sql
-- Поиск по разделам
SELECT * FROM Section
WHERE spaceId = ? AND title LIKE '%query%'

-- Поиск по контенту (title, content, fileName)
SELECT * FROM Item
WHERE spaceId = ? AND (
  title LIKE '%query%'
  OR content LIKE '%query%'
  OR fileName LIKE '%query%'
)
```

**Результаты поиска включают:**
- Тип результата (section/item)
- Путь от корня (хлебные крошки)
- Для items: тип контента, название раздела

### TelegramModule
**Файлы:** `src/telegram/`

**Ответственность:**
- Обработка webhook от Telegram
- Отправка сообщений и файлов в группы
- Проверка прав пользователей

**TelegramController:**
- `POST /telegram/webhook` — обработка событий (my_chat_member, callback_query, message)

**TelegramService:**
- `sendMessage(chatId, text, options)` — отправка сообщения
- `answerCallbackQuery(callbackQueryId, text?)` — ответ на callback
- `editMessageText(chatId, messageId, text, options)` — редактирование сообщения

**TelegramApiService:**
- `sendMessage(chatId, text, options)` — отправка сообщения
- `sendPhoto(chatId, photo, options)` — отправка фото (возвращает file_id)
- `sendDocument(chatId, document, options)` — отправка документа (возвращает file_id)
- `getChatMember(chatId, userId)` — получить статус участника
- `getChat(chatId)` — информация о чате
- `getFile(fileId)` — информация о файле (file_path)
- `getFileUrl(filePath)` — URL для скачивания
- `canWrite(status)` — проверка права на запись
- `canDeleteOthers(status)` — проверка права удалять чужой контент

**Обработка событий:**

| Событие | Действие |
|---------|----------|
| `my_chat_member` (бот добавлен) | Отправить приветствие с кнопкой |
| `my_chat_member` (бот удалён) | Удалить Space (опционально) |

---

## API Endpoints

### Публичные

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/` | Healthcheck (возвращает "OK") |
| `GET` | `/health` | Статус сервиса (возвращает `{status: "ok"}`) |
| `POST` | `/telegram/webhook` | Telegram webhook |
| `POST` | `/auth/telegram` | Авторизация через initData |

### Защищённые (требуют JWT)

**Пользователь:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/me` | Данные текущего пользователя и его права |

**Разделы:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/sections` | Корневые разделы пространства |
| `GET` | `/api/sections/:id` | Раздел с детьми, контентом и путём (хлебные крошки) |
| `GET` | `/api/sections/:id/children` | Дочерние разделы |
| `POST` | `/api/sections` | Создать раздел |
| `PATCH` | `/api/sections/:id` | Обновить раздел |
| `DELETE` | `/api/sections/:id` | Удалить раздел (каскадно с детьми) |
| `POST` | `/api/sections/:id/move` | Переместить раздел в другой родительский раздел |

**Контент:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/items/:id` | Получить item |
| `POST` | `/api/sections/:sectionId/items` | Создать item в разделе |
| `POST` | `/api/sections/:sectionId/items/upload` | Загрузить файл/изображение в раздел |
| `PATCH` | `/api/items/:id` | Обновить item |
| `DELETE` | `/api/items/:id` | Удалить item |
| `POST` | `/api/items/:id/move` | Переместить item в другой раздел |

**Файлы:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/files/:fileId` | Получить URL для скачивания файла из Telegram |

**Поиск:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/search?q=query&limit=50` | Полнотекстовый поиск по пространству |
| `GET` | `/api/search/quick?q=query` | Быстрый поиск для автодополнения (только разделы) |

---

## Авторизация

### Поток авторизации Mini App

```
[Telegram Mini App в группе]
       │
       ▼
1. Получение initData от Telegram WebApp
   (содержит user, chat_id, auth_date, hash)
       │
       ▼
2. POST /auth/telegram { initData }
       │
       ▼
3. Backend:
   - Парсинг initData
   - Верификация HMAC подписи
   - Проверка auth_date (не старше 1 часа)
   - Извлечение chat_id из initData
   - findOrCreate User
   - findOrCreate Space по chat_id
   - Проверка членства в группе (getChatMember)
   - Генерация JWT с userId и spaceId
       │
       ▼
4. Ответ: { accessToken, user, space }
       │
       ▼
5. Mini App сохраняет токен
       │
       ▼
6. Все запросы с заголовком:
   Authorization: Bearer <token>
```

### JWT Payload

```typescript
{
  sub: number,        // User ID
  telegramId: string, // Telegram ID
  spaceId: number,    // Space ID
  chatId: string,     // Telegram chat_id группы
  role: string,       // Роль в группе
  iat: number,        // Issued at
  exp: number         // Expiration
}
```

### Проверка прав

**PermissionsGuard** проверяет права для каждого запроса:

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { chatId, telegramId } = request.user;

    // Получаем статус участника из Telegram API
    const member = await this.telegramApi.getChatMember(chatId, telegramId);

    // Определяем права
    const canWrite = ['creator', 'administrator', 'member'].includes(member.status);
    const canDelete = ['creator', 'administrator'].includes(member.status);

    request.permissions = { canWrite, canDelete };
    return true;
  }
}
```

**Права по ролям:**

| Telegram статус | canWrite | canDelete | Описание |
|-----------------|----------|-----------|----------|
| `creator` | ✅ | ✅ | Владелец группы |
| `administrator` | ✅ | ✅ | Администратор |
| `member` | ✅ | ❌* | Обычный участник |
| `restricted` | ❌ | ❌ | Ограниченный участник |
| `left` | ❌ | ❌ | Вышел из группы |
| `kicked` | ❌ | ❌ | Заблокирован |

*member может удалять только свой контент

---

## Уведомления

### Отправка уведомлений в группу

При создании/изменении контента бот отправляет сообщение:

```typescript
// sections.service.ts
async create(spaceId: number, dto: CreateSectionDto, userId: number) {
  const section = await this.prisma.section.create({ ... });

  // Отправляем уведомление
  const space = await this.prisma.space.findUnique({ where: { id: spaceId } });
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  await this.telegramService.sendNotification(
    space.chatId,
    `📁 ${user.firstName} создал раздел "${section.title}"`,
    section.id
  );

  return section;
}
```

### Формат уведомления с кнопкой

```typescript
// telegram.service.ts
async sendNotification(chatId: string, text: string, sectionId?: number) {
  const options: any = {};

  if (sectionId) {
    options.reply_markup = {
      inline_keyboard: [[
        {
          text: '📂 Открыть раздел',
          web_app: {
            url: `${this.miniAppUrl}?section=${sectionId}`
          }
        }
      ]]
    };
  }

  await this.sendMessage(chatId, text, options);
}
```

---

## Потоки данных

### Получение разделов с вложенностью

```
[Mini App] GET /api/sections?parentId=null
     │
     ▼
[JwtAuthGuard] → Валидация токена → req.user (spaceId)
     │
     ▼
[SectionsController.getAll]
     │
     ▼
[SectionsService.getRootSections(spaceId)]
     │
     ▼
[PrismaService]
SELECT * FROM Section
WHERE spaceId = ? AND parentId IS NULL
ORDER BY "order"
     │
     ▼
[Response] → [{ id, title, ... }, ...]
```

### Создание контента

```
[Mini App] POST /api/items { sectionId, type, content }
     │
     ▼
[JwtAuthGuard] → req.user
     │
     ▼
[PermissionsGuard] → getChatMember → req.permissions
     │
     ▼
[ItemsController.create]
     │
     │  if (!permissions.canWrite) throw ForbiddenException
     │
     ▼
[ItemsService.create]
     │
     ├──▶ [PrismaService] INSERT INTO Item
     │
     └──▶ [TelegramService.sendNotification] → Уведомление в группу
     │
     ▼
[Response] → { id, type, content, ... }
```

### Поиск

```
[Mini App] GET /api/search?q=отель
     │
     ▼
[JwtAuthGuard] → req.user (spaceId)
     │
     ▼
[SearchController.search]
     │
     ▼
[SearchService.search(spaceId, "отель", 20)]
     │
     ├──▶ Поиск по Section.title
     │
     └──▶ Поиск по Item.title, Item.content
     │
     ▼
[Построение путей для каждого результата]
     │
     ▼
[Response] → [
  { type: 'item', title: 'Отель Sultan', path: [...], ... },
  { type: 'section', title: 'Отели', path: [...], ... }
]
```

---

## Конфигурация

### ValidationPipe (глобальный)
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Удалять лишние поля
  forbidNonWhitelisted: true, // Ошибка при лишних полях
  transform: true,            // Автоматическое преобразование типов
}));
```

### CORS
```typescript
app.enableCors({
  origin: true,      // Все origins (для Mini App)
  credentials: true,
});
```

---

## Обработка событий Telegram

### Бот добавлен в группу

```typescript
// telegram.service.ts
async handleMyChat Member(update: Update) {
  const { chat, new_chat_member } = update.my_chat_member;

  // Бот добавлен в группу
  if (new_chat_member.user.id === this.botId &&
      new_chat_member.status === 'member') {

    await this.sendMessage(chat.id,
      '👋 Привет! Я помогу организовать информацию вашей группы.\n\n' +
      'Нажмите кнопку ниже, чтобы открыть приложение.',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '📂 Открыть приложение',
              web_app: { url: this.miniAppUrl }
            }
          ]]
        }
      }
    );
  }

  // Бот удалён из группы
  if (new_chat_member.user.id === this.botId &&
      ['left', 'kicked'].includes(new_chat_member.status)) {
    // Опционально: удалить Space
  }
}
```
