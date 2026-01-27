# План реализации Frontend

## Текущее состояние

- Простой SPA без роутинга
- Разделы привязаны к пользователю (userId) — **устарело**
- Нет вложенности разделов
- Нет контента (Items)
- Нет поиска
- Нет хлебных крошек

## Целевое состояние

- Навигация по вложенным разделам
- Контент внутри разделов (text, link, file, image)
- Хлебные крошки для навигации
- Поиск по пространству
- Права доступа (canWrite, canDelete, canManage)
- Deep links (?section=123)

---

## Фазы реализации

### Фаза 1: Обновление типов
**Файл:** `src/types/index.ts`

**Задачи:**
- [ ] Обновить интерфейс `Section` (убрать type, добавить parentId, order, _count)
- [ ] Добавить интерфейс `Item` (type, title, content, fileId, etc.)
- [ ] Добавить интерфейс `Breadcrumb` (id, title)
- [ ] Добавить интерфейс `Permissions` (canRead, canWrite, canDeleteOwn, canDeleteOthers, canManage)
- [ ] Обновить `AuthResponse` (добавить permissions)
- [ ] Добавить типы для поиска `SearchResult`, `SectionSearchResult`, `ItemSearchResult`
- [ ] Добавить DTO типы `CreateSectionDto`, `CreateItemDto`

---

### Фаза 2: Обновление API клиента
**Файл:** `src/api/client.ts`

**Задачи:**
- [ ] Обновить `auth()` — новый формат ответа с permissions
- [ ] Добавить `getMe()` — GET /api/me
- [ ] Обновить `getSections()` — GET /api/sections (корневые)
- [ ] Добавить `getSection(id)` — GET /api/sections/:id (с детьми и items)
- [ ] Добавить `getSectionChildren(id)` — GET /api/sections/:id/children
- [ ] Обновить `createSection(dto)` — с parentId
- [ ] Добавить `moveSection(id, parentId)`
- [ ] Добавить `getItem(id)` — GET /api/items/:id
- [ ] Добавить `createItem(sectionId, dto)` — POST /api/sections/:sectionId/items
- [ ] Добавить `updateItem(id, dto)` — PATCH /api/items/:id
- [ ] Добавить `deleteItem(id)` — DELETE /api/items/:id
- [ ] Добавить `search(query, limit?)` — GET /api/search
- [ ] Добавить `quickSearch(query)` — GET /api/search/quick

---

### Фаза 3: Обновление хуков
**Файлы:** `src/hooks/`

**Задачи:**
- [ ] Обновить `useTelegram.ts` — добавить chatId из start_param
- [ ] Создать `useAuth.ts` — авторизация, user, permissions, loading, error
- [ ] Создать `useNavigation.ts` — currentSection, breadcrumbs, navigateTo, goBack, BackButton

---

### Фаза 4: Обновление существующих компонентов
**Файлы:** `src/components/`

**Задачи:**
- [ ] Обновить `SectionCard.tsx` — убрать type, добавить счётчики (children, items)
- [ ] Обновить `SectionCard.css`
- [ ] Обновить `SectionList.tsx` — принимает sections через props, не загружает сам
- [ ] Обновить `AddSectionModal.tsx` — добавить parentId, убрать выбор типа

---

### Фаза 5: Новые компоненты
**Файлы:** `src/components/`

**Задачи:**
- [ ] Создать `Breadcrumbs.tsx` + CSS — путь навигации
- [ ] Создать `ItemCard.tsx` + CSS — карточка контента (по типам)
- [ ] Создать `ItemList.tsx` + CSS — список контента
- [ ] Создать `AddItemModal.tsx` + CSS — форма создания контента

---

### Фаза 6: Создание страниц
**Файлы:** `src/pages/`

**Задачи:**
- [ ] Создать папку `pages/`
- [ ] Создать `HomePage.tsx` — корневой экран (поиск + разделы)
- [ ] Создать `SectionPage.tsx` — экран раздела (breadcrumbs + подразделы + контент)

---

### Фаза 7: Поиск
**Файлы:** `src/components/`

**Задачи:**
- [ ] Создать `SearchBar.tsx` + CSS — поле поиска с debounce
- [ ] Создать `SearchResults.tsx` + CSS — результаты поиска

---

### Фаза 8: Обновление App.tsx
**Файл:** `src/App.tsx`

**Задачи:**
- [ ] Интегрировать `useAuth` хук
- [ ] Интегрировать `useNavigation` хук
- [ ] Добавить роутинг на основе состояния (HomePage / SectionPage)
- [ ] Обработка deep links (?section=123)
- [ ] Обновить loading/error состояния

---

### Фаза 9: Стили
**Файлы:** `src/*.css`

**Задачи:**
- [ ] Обновить `index.css` — Telegram theme variables
- [ ] Обновить `App.css`
- [ ] Убрать неиспользуемые стили

---

### Фаза 10: Проверка сборки

**Задачи:**
- [ ] `npm run build` — проверка TypeScript
- [ ] `npm run lint` — проверка ESLint
- [ ] Тестирование в браузере

---

## Структура после реализации

```
frontend/src/
├── api/
│   └── client.ts           # Обновлён
├── components/
│   ├── AddItemModal.tsx    # Новый
│   ├── AddItemModal.css
│   ├── AddSectionModal.tsx # Обновлён
│   ├── AddSectionModal.css
│   ├── Breadcrumbs.tsx     # Новый
│   ├── Breadcrumbs.css
│   ├── ItemCard.tsx        # Новый
│   ├── ItemCard.css
│   ├── ItemList.tsx        # Новый
│   ├── ItemList.css
│   ├── SearchBar.tsx       # Новый
│   ├── SearchBar.css
│   ├── SearchResults.tsx   # Новый
│   ├── SearchResults.css
│   ├── SectionCard.tsx     # Обновлён
│   ├── SectionCard.css
│   ├── SectionList.tsx     # Обновлён
│   └── SectionList.css
├── hooks/
│   ├── useAuth.ts          # Новый
│   ├── useNavigation.ts    # Новый
│   └── useTelegram.ts      # Обновлён
├── pages/
│   ├── HomePage.tsx        # Новый
│   └── SectionPage.tsx     # Новый
├── types/
│   └── index.ts            # Обновлён
├── App.tsx                 # Обновлён
├── App.css
├── main.tsx
└── index.css               # Обновлён
```

---

## Зависимости между фазами

```
Фаза 1 (типы)
    │
    ▼
Фаза 2 (API клиент) ──────────┐
    │                         │
    ▼                         │
Фаза 3 (хуки) ◄───────────────┤
    │                         │
    ├─────────────────────────┤
    │                         │
    ▼                         ▼
Фаза 4 (компоненты)    Фаза 5 (новые компоненты)
    │                         │
    └──────────┬──────────────┘
               │
               ▼
        Фаза 6 (страницы)
               │
               ▼
        Фаза 7 (поиск)
               │
               ▼
        Фаза 8 (App.tsx)
               │
               ▼
        Фаза 9 (стили)
               │
               ▼
        Фаза 10 (сборка)
```

---

## Примечания

- Каждая фаза завершается проверкой сборки (если возможно)
- При ошибках компиляции — исправление до перехода к следующей фазе
- Стили можно дорабатывать параллельно
- Поиск (Фаза 7) можно отложить на post-MVP
