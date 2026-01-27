# TG-App — Модели данных

## Обзор

Приложение использует четыре основных сущности:
- **Space** — пространство, привязанное к Telegram-группе
- **Section** — раздел/подраздел с поддержкой вложенности
- **Item** — единица контента внутри раздела
- **User** — кэш данных пользователя Telegram

---

## Prisma Schema

**Файл:** `backend/prisma/schema.prisma`

### Space — Пространства (группы)

```prisma
model Space {
  id        Int      @id @default(autoincrement())
  chatId    String   @unique  // Telegram chat_id группы
  title     String?           // Название группы (кэш)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sections Section[]
  items    Item[]
}
```

**Поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| id | Int | Внутренний ID |
| chatId | String | Уникальный Telegram chat_id группы |
| title | String? | Название группы (опционально, для отображения) |
| createdAt | DateTime | Дата создания |
| updatedAt | DateTime | Дата обновления |

**Связи:**
- `sections` — разделы пространства (один-ко-многим)
- `items` — контент пространства (один-ко-многим)

**Примечание:** Space создаётся автоматически при первом открытии Mini App из группы.

---

### Section — Разделы

```prisma
model Section {
  id        Int      @id @default(autoincrement())
  title     String
  order     Int      @default(0)  // Порядок сортировки
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Связь с пространством
  space   Space @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  spaceId Int

  // Вложенность: родительский раздел
  parent   Section?  @relation("SectionToSection", fields: [parentId], references: [id], onDelete: Cascade)
  parentId Int?

  // Дочерние разделы
  children Section[] @relation("SectionToSection")

  // Контент внутри раздела
  items Item[]

  // Кто создал
  createdBy   User? @relation(fields: [createdById], references: [id])
  createdById Int?
}
```

**Поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| id | Int | ID раздела |
| title | String | Название раздела |
| order | Int | Порядок сортировки среди siblings |
| spaceId | Int | Пространство |
| parentId | Int? | Родительский раздел (null = корневой) |
| createdById | Int? | Кто создал раздел |
| createdAt | DateTime | Дата создания |
| updatedAt | DateTime | Дата обновления |

**Связи:**
- `space` — пространство, которому принадлежит раздел
- `parent` — родительский раздел (для вложенности)
- `children` — дочерние разделы
- `items` — контент внутри раздела
- `createdBy` — автор раздела

**Примеры вложенности:**

```
Section(id=1, title="Отпуск 2025", parentId=null)
├── Section(id=2, title="Турция", parentId=1)
│   ├── Section(id=4, title="Отели", parentId=2)
│   └── Section(id=5, title="Экскурсии", parentId=2)
└── Section(id=3, title="Грузия", parentId=1)
```

---

### Item — Контент

```prisma
model Item {
  id        Int      @id @default(autoincrement())
  type      String   // 'text' | 'link' | 'file' | 'image'
  title     String?  // Название (опционально)
  content   String?  // Текст заметки или URL ссылки
  fileId    String?  // Telegram file_id для файлов/изображений
  fileName  String?  // Оригинальное имя файла
  fileSize  Int?     // Размер файла в байтах
  mimeType  String?  // MIME-тип файла
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Связь с пространством (для поиска)
  space   Space @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  spaceId Int

  // Связь с разделом
  section   Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  sectionId Int

  // Кто создал
  createdBy   User? @relation(fields: [createdById], references: [id])
  createdById Int?
}
```

**Поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| id | Int | ID записи |
| type | String | Тип контента |
| title | String? | Название |
| content | String? | Текст или URL |
| fileId | String? | Telegram file_id |
| fileName | String? | Имя файла |
| fileSize | Int? | Размер в байтах |
| mimeType | String? | MIME-тип |
| order | Int | Порядок сортировки |
| spaceId | Int | Пространство (для быстрого поиска) |
| sectionId | Int | Раздел |
| createdById | Int? | Автор |

**Типы контента:**

| type | Описание | Используемые поля |
|------|----------|-------------------|
| `text` | Текстовая заметка | content |
| `link` | Ссылка | title, content (URL) |
| `file` | Файл | title, fileId, fileName, fileSize, mimeType |
| `image` | Изображение | title, fileId, fileName, fileSize, mimeType |

---

### User — Пользователи

```prisma
model User {
  id         Int      @id @default(autoincrement())
  telegramId String   @unique
  username   String?
  firstName  String?
  lastName   String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  sections Section[]
  items    Item[]
}
```

**Поля:**

| Поле | Тип | Описание |
|------|-----|----------|
| id | Int | Внутренний ID |
| telegramId | String | Уникальный Telegram ID |
| username | String? | @username |
| firstName | String? | Имя |
| lastName | String? | Фамилия |

**Назначение:**
- Кэширование данных пользователя из Telegram
- Связь с созданным контентом (кто создал)
- НЕ используется для прав доступа (права через Telegram API)

---

## ER-диаграмма

```
┌─────────────────┐
│      Space      │
├─────────────────┤
│ id              │
│ chatId (unique) │◄─────────────────────────────────┐
│ title           │                                  │
│ createdAt       │                                  │
│ updatedAt       │                                  │
└────────┬────────┘                                  │
         │                                           │
         │ 1:N                                       │
         ▼                                           │
┌─────────────────┐       ┌─────────────────┐       │
│     Section     │       │      Item       │       │
├─────────────────┤       ├─────────────────┤       │
│ id              │       │ id              │       │
│ title           │       │ type            │       │
│ order           │       │ title           │       │
│ spaceId         │───────│ content         │       │
│ parentId        │──┐    │ fileId          │       │
│ createdById     │  │    │ fileName        │       │
│ createdAt       │  │    │ fileSize        │       │
│ updatedAt       │  │    │ mimeType        │       │
└────────┬────────┘  │    │ order           │       │
         │           │    │ spaceId         │───────┘
         │ self-ref  │    │ sectionId       │───────┐
         └───────────┘    │ createdById     │       │
                          │ createdAt       │       │
                          │ updatedAt       │       │
                          └─────────────────┘       │
                                   ▲                │
                                   │ N:1            │
                                   └────────────────┘

┌─────────────────┐
│      User       │
├─────────────────┤
│ id              │
│ telegramId      │◄── createdById (Section, Item)
│ username        │
│ firstName       │
│ lastName        │
└─────────────────┘
```

---

## TypeScript интерфейсы

### Frontend типы

**Файл:** `frontend/src/types/index.ts`

```typescript
// ============================================================================
// User — данные пользователя из Telegram
// ============================================================================
export interface User {
  id: number;
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Permissions — права доступа в пространстве (группе)
// Определяются на основе роли пользователя в Telegram группе
// ============================================================================
export interface Permissions {
  canRead: boolean;       // Может просматривать контент
  canWrite: boolean;      // Может создавать/редактировать свой контент
  canDeleteOwn: boolean;  // Может удалять свой контент
  canDeleteOthers: boolean; // Может удалять чужой контент (админ)
  canManage: boolean;     // Может управлять разделами (админ)
}

// ============================================================================
// Section — раздел с поддержкой вложенности
// ============================================================================
export interface Section {
  id: number;
  title: string;
  order: number;
  parentId: number | null;
  spaceId: number;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
  // Счётчики для отображения
  _count?: {
    children: number;
    items: number;
  };
  // Данные автора (если включены)
  createdBy?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  };
}

// Раздел с полными данными (дети + контент + путь)
export interface SectionWithContent extends Section {
  children: Section[];
  items: Item[];
  path?: Breadcrumb[];
}

// ============================================================================
// Item — единица контента внутри раздела
// ============================================================================
export type ItemType = 'text' | 'link' | 'file' | 'image';

export interface Item {
  id: number;
  type: ItemType;
  title?: string | null;
  content?: string | null;   // Текст или URL
  fileId?: string | null;    // Telegram file_id
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  order: number;
  sectionId: number;
  spaceId: number;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
  // Данные автора
  createdBy?: {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  };
  // Данные раздела (при получении отдельно)
  section?: {
    id: number;
    title: string;
    spaceId: number;
  };
}

// ============================================================================
// Breadcrumb — элемент хлебных крошек
// ============================================================================
export interface Breadcrumb {
  id: number;
  title: string;
}

// ============================================================================
// Search — результаты поиска
// ============================================================================
export interface SectionSearchResult {
  type: 'section';
  id: number;
  title: string;
  parentId: number | null;
  path: string[];
}

export interface ItemSearchResult {
  type: 'item';
  id: number;
  itemType: ItemType;
  title: string | null;
  content: string | null;
  fileName: string | null;
  sectionId: number;
  sectionTitle: string;
  path: string[];
}

export type SearchResult = SectionSearchResult | ItemSearchResult;

// ============================================================================
// Auth — авторизация
// ============================================================================
export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Ответ GET /api/me
export interface MeResponse {
  user: {
    id: number;
    telegramId: string;
    spaceId: number;
    chatId: string;
    role: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  permissions: Permissions;
}

// ============================================================================
// Quick Search — для автодополнения
// ============================================================================
export interface QuickSearchResult {
  id: number;
  title: string;
  type: 'section' | 'item';
}
```

### Backend DTO

**CreateSectionDto:**
```typescript
export interface CreateSectionDto {
  title: string;
  parentId?: number | null;  // null = корневой раздел
}
```

**UpdateSectionDto:**
```typescript
export interface UpdateSectionDto {
  title?: string;
  order?: number;
  parentId?: number | null;  // Перемещение в другой раздел
}
```

**CreateItemDto:**
```typescript
// Используется в POST /api/sections/:sectionId/items
// sectionId передаётся в URL, не в теле запроса
export interface CreateItemDto {
  type: ItemType;
  title?: string | null;
  content?: string | null;   // Для text и link
  fileId?: string | null;    // Для file и image (заполняется при upload)
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}
```

**UpdateItemDto:**
```typescript
export interface UpdateItemDto {
  title?: string | null;
  content?: string | null;
  order?: number;
}
```

**Перемещение раздела:**
```typescript
// POST /api/sections/:id/move
export interface MoveSectionDto {
  parentId: number | null;  // ID целевого родительского раздела (null = корень)
}
```

**Перемещение item:**
```typescript
// POST /api/items/:id/move
export interface MoveItemDto {
  sectionId: number;  // ID целевого раздела
}
```

**Загрузка файла:**
```typescript
// POST /api/sections/:sectionId/items/upload
// Content-Type: multipart/form-data
// - file: File (обязательно, макс. 50MB)
// - title: string (опционально)
// Файл отправляется в Telegram группу, file_id сохраняется в БД
```

**SearchQueryDto:**
```typescript
// GET /api/search?q=query&limit=50
// GET /api/search/quick?q=query
interface SearchQueryDto {
  q: string;          // Поисковый запрос
  limit?: number;     // Лимит результатов (default: 50 для search, 10 для quick)
}
```

---

## Индексы для производительности

```prisma
// Быстрый поиск разделов по пространству и родителю
@@index([spaceId, parentId])

// Быстрый поиск контента по разделу
@@index([sectionId])

// Быстрый поиск по пространству (для поиска)
@@index([spaceId])
```

---

## Каскадное удаление

При удалении:
- **Space** → удаляются все Section и Item
- **Section** → удаляются все дочерние Section и Item внутри
- **User** → Section и Item остаются (createdById = null)
