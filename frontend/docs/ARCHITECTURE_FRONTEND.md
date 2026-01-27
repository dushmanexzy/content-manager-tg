# TG-App Frontend — Архитектура

## Обзор

Frontend — это **Telegram Mini App**, построенный на **React + TypeScript** с использованием **Vite** для сборки. Приложение интегрируется с Telegram Web App SDK для нативного UX.

## Структура проекта

```
frontend/
├── src/
│   ├── main.tsx                    # Точка входа
│   ├── App.tsx                     # Корневой компонент с роутингом
│   ├── App.css                     # Глобальные стили приложения
│   ├── index.css                   # Base styles
│   │
│   ├── api/                        # API клиент
│   │   └── client.ts
│   │
│   ├── hooks/                      # React hooks
│   │   ├── useTelegram.ts          # Telegram WebApp API + mock для dev
│   │   ├── useAuth.ts              # Авторизация и права
│   │   └── useNavigation.ts        # Навигация по разделам
│   │
│   ├── components/                 # UI компоненты
│   │   ├── Header.tsx              # Шапка с поиском
│   │   ├── Header.css
│   │   ├── CollapsedBreadcrumbs.tsx # Сворачиваемые хлебные крошки
│   │   ├── CollapsedBreadcrumbs.css
│   │   ├── Breadcrumbs.tsx         # Обычные хлебные крошки
│   │   ├── Breadcrumbs.css
│   │   ├── BottomActions.tsx       # Нижние кнопки действий
│   │   ├── BottomActions.css
│   │   ├── SectionList.tsx         # Список разделов
│   │   ├── SectionList.css
│   │   ├── SectionCard.tsx         # Карточка раздела
│   │   ├── SectionCard.css
│   │   ├── ItemList.tsx            # Список контента
│   │   ├── ItemList.css
│   │   ├── ItemCard.tsx            # Карточка контента
│   │   ├── ItemCard.css
│   │   ├── AddSectionModal.tsx     # Модал создания раздела
│   │   ├── AddSectionModal.css
│   │   ├── AddItemModal.tsx        # Модал создания контента
│   │   ├── AddItemModal.css
│   │   ├── ItemViewModal.tsx       # Модал просмотра контента
│   │   ├── ItemViewModal.css
│   │   ├── SearchBar.tsx           # Поле поиска (legacy)
│   │   ├── SearchBar.css
│   │   ├── SearchResults.tsx       # Результаты поиска
│   │   └── SearchResults.css
│   │
│   ├── pages/                      # Страницы/экраны
│   │   ├── HomePage.tsx            # Главная — корневые разделы
│   │   ├── HomePage.css
│   │   ├── SectionPage.tsx         # Страница раздела
│   │   └── SectionPage.css
│   │
│   ├── types/                      # TypeScript типы
│   │   └── index.ts
│   │
│   └── assets/                     # Статические ресурсы
│
├── public/
├── index.html                      # HTML template
├── vite.config.ts                  # Vite конфигурация
├── tsconfig.json
└── package.json
```

## Компоненты

### App (корневой)
**Файл:** `src/App.tsx`

**Ответственность:**
- Инициализация Telegram WebApp через `useTelegram`
- Авторизация через `useAuth`
- Навигация через `useNavigation`
- Глобальный поиск
- Обработка deep link параметров (`start_param`)
- Отображение состояний: загрузка, ошибка, контент

**Состояния:**
- Поиск: `searchQuery`, `searchResults`, `searchLoading`, `isSearchMode`
- Авторизация: через `useAuth` хук
- Навигация: через `useNavigation` хук

**Логика:**
```
1. useTelegram → tg.ready(), tg.expand() или mock
   │
   ▼
2. useAuth.login(initData) → apiClient.auth() + apiClient.getMe()
   │
   ▼
3. Проверка deepLinkSectionId из start_param
   │
   ├── Есть → navigation.navigateTo(sectionId)
   │
   └── Нет → navigation.loadRootSections()
   │
   ▼
4. Рендер: Header + (SearchResults | SectionPage | HomePage)
```

---

### Страницы

#### HomePage
**Файл:** `src/pages/HomePage.tsx`

Корневой экран — список разделов первого уровня.

**Props:**
```typescript
interface HomePageProps {
  sections: Section[];
  permissions: Permissions | null;
  onSectionClick: (section: Section) => void;
  onRefresh: () => void;
  webApp: any;
}
```

**Содержит:**
- Заголовок "Разделы"
- `SectionList` — список корневых разделов
- `BottomActions` — кнопка "Добавить раздел"
- `AddSectionModal` — модал создания

#### SectionPage
**Файл:** `src/pages/SectionPage.tsx`

Экран раздела — подразделы + контент.

**Props:**
```typescript
interface SectionPageProps {
  section: SectionWithContent;
  breadcrumbs?: any;
  permissions: Permissions | null;
  onSectionClick: (section: Section) => void;
  onBreadcrumbClick?: any;
  onBack?: any;
  onRefresh: () => void;
  webApp: any;
}
```

**Содержит:**
- Заголовок раздела
- `SectionList` — дочерние разделы (если есть)
- `ItemList` — контент раздела (если есть)
- `BottomActions` — кнопки "Раздел" и "Элемент"
- `AddSectionModal` — модал создания подраздела
- `AddItemModal` — модал создания контента
- `ItemViewModal` — модал просмотра контента

---

### UI Компоненты

#### Header
**Файл:** `src/components/Header.tsx`

**Ответственность:**
- Иконка поиска справа, при клике раскрывается input
- Хлебные крошки ниже (скрываются при активном поиске)

**Props:**
```typescript
interface HeaderProps {
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  showBreadcrumbs?: boolean;
  breadcrumbs?: React.ReactNode;
}
```

#### CollapsedBreadcrumbs
**Файл:** `src/components/CollapsedBreadcrumbs.tsx`

**Ответственность:**
- Компактные хлебные крошки: 🏠 > ... > Текущий
- При клике на `...` открывается Telegram Popup Menu с промежуточными уровнями
- Fallback на browser prompt в dev-режиме

**Props:**
```typescript
interface CollapsedBreadcrumbsProps {
  path: Breadcrumb[];
  onNavigate: (sectionId: number | null) => void;
  webApp: any;
}
```

#### BottomActions
**Файл:** `src/components/BottomActions.tsx`

**Ответственность:**
- На главной: одна кнопка "Добавить раздел" (на всю ширину)
- В разделе: две кнопки "Раздел" и "Элемент" (50/50)
- Скрывается если нет прав на запись

**Props:**
```typescript
interface BottomActionsProps {
  isHomePage?: boolean;
  canWrite?: boolean;
  onAddSection?: () => void;
  onAddItem?: () => void;
}
```

#### SectionList
**Файл:** `src/components/SectionList.tsx`

**Ответственность:**
- Отображение списка разделов
- Обработка кликов → навигация

**Props:**
```typescript
interface Props {
  sections: Section[];
  onSectionClick: (section: Section) => void;
}
```

#### SectionCard
**Файл:** `src/components/SectionCard.tsx`

**Ответственность:**
- Отображение одного раздела
- Иконка папки, название, счётчики

**Props:**
```typescript
interface Props {
  section: Section;
  onClick: () => void;
}
```

#### ItemList
**Файл:** `src/components/ItemList.tsx`

**Ответственность:**
- Отображение списка контента

**Props:**
```typescript
interface Props {
  items: Item[];
  onItemClick: (item: Item) => void;
}
```

#### ItemCard
**Файл:** `src/components/ItemCard.tsx`

**Ответственность:**
- Отображение единицы контента
- Разный вид для разных типов (text, link, file, image)

**Props:**
```typescript
interface Props {
  item: Item;
  onClick: () => void;
}
```

**Отображение по типам:**

| type | Иконка | Контент |
|------|--------|---------|
| `text` | 📝 | Превью текста (первые N символов) |
| `link` | 🔗 | Название + домен URL |
| `file` | 📄 | Имя файла + размер |
| `image` | 🖼 | Превью изображения |

#### ItemViewModal
**Файл:** `src/components/ItemViewModal.tsx`

**Ответственность:**
- Модальное окно для просмотра контента
- Загрузка URL файла из Telegram через `apiClient.getFileUrl()`
- Действия: копирование, открытие ссылки, скачивание файла

**Props:**
```typescript
interface ItemViewModalProps {
  item: Item;
  onClose: () => void;
}
```

#### SearchResults
**Файл:** `src/components/SearchResults.tsx`

**Ответственность:**
- Отображение результатов поиска
- Показ пути к каждому результату
- Навигация по клику

**Props:**
```typescript
interface Props {
  results: SearchResult[];
  query: string;
  loading?: boolean;
  onResultClick: (result: SearchResult) => void;
}
```

#### AddSectionModal
**Файл:** `src/components/AddSectionModal.tsx`

**Ответственность:**
- Форма создания раздела
- Валидация названия

**Props:**
```typescript
interface Props {
  parentId: number | null;
  onClose: () => void;
  onSubmit: (title: string) => void;
}
```

#### AddItemModal
**Файл:** `src/components/AddItemModal.tsx`

**Ответственность:**
- Форма создания контента
- Выбор типа (text, link, file, image)
- Загрузка файлов через `apiClient.uploadItem()`

**Props:**
```typescript
interface Props {
  sectionId: number;
  onClose: () => void;
  onSubmit: (data: CreateItemDto) => void;
  onFileUploaded?: () => void;
}
```

---

## Hooks

### useTelegram
**Файл:** `src/hooks/useTelegram.ts`

**Ответственность:**
- Инициализация Telegram WebApp
- Mock-режим для локальной разработки без Telegram
- Парсинг deep links из `start_param`

**Возвращает:**
```typescript
{
  webApp: TelegramWebApp | null,
  user: TelegramUser | undefined,
  chat: TelegramChat | undefined,
  initData: string,
  isReady: boolean,
  colorScheme: 'light' | 'dark',
  themeParams: ThemeParams,
  startParam: string | undefined,
  deepLinkSectionId: number | null,  // Парсится из start_param (section_123)
  isMock: boolean,                    // true если dev без Telegram
}
```

**Mock-режим:**
- Активируется в dev режиме если нет `window.Telegram.WebApp.initData`
- Создаёт mock WebApp с тестовыми данными
- Рендерит mock MainButton внизу экрана
- Логирует HapticFeedback в консоль

### useAuth
**Файл:** `src/hooks/useAuth.ts`

**Ответственность:**
- Авторизация через API
- Получение прав пользователя
- Хранение состояния авторизации

**Возвращает:**
```typescript
{
  isAuthenticated: boolean,
  user: User | null,
  permissions: Permissions | null,  // Права из /api/me
  loading: boolean,
  error: string | null,
  login: (initData: string) => Promise<boolean>,
  logout: () => void,
}
```

**Поток авторизации:**
1. `apiClient.auth(initData)` → получение JWT токена
2. `apiClient.setToken(token)`
3. `apiClient.getMe()` → получение прав пользователя

### useNavigation
**Файл:** `src/hooks/useNavigation.ts`

**Ответственность:**
- Навигация по разделам
- История навигации
- Хлебные крошки
- Управление BackButton

**Возвращает:**
```typescript
{
  currentSection: SectionWithContent | null,
  breadcrumbs: Breadcrumb[],
  sections: Section[],      // Текущие разделы для отображения
  items: Item[],            // Контент текущего раздела
  loading: boolean,
  error: string | null,
  isAtRoot: boolean,
  navigateTo: (sectionId: number) => Promise<void>,
  goBack: () => Promise<void>,
  goToRoot: () => Promise<void>,
  navigateToBreadcrumb: (sectionId: number | null) => Promise<void>,
  loadRootSections: () => Promise<void>,
  refresh: () => Promise<void>,
}
```

**Управление BackButton:**
- Скрыт на корневом уровне
- Показан в разделах
- При клике вызывает `goBack()`

---

## API Client

### apiClient
**Файл:** `src/api/client.ts`

**Методы:**

| Метод | Описание |
|-------|----------|
| `setToken(token)` | Установить JWT токен |
| `auth(initData)` | POST /auth/telegram |
| `getMe()` | GET /api/me — пользователь и права |
| `getSections()` | GET /api/sections — корневые разделы |
| `getSection(id)` | GET /api/sections/:id — раздел с детьми, items и path |
| `getSectionChildren(id)` | GET /api/sections/:id/children |
| `createSection(dto)` | POST /api/sections |
| `updateSection(id, dto)` | PATCH /api/sections/:id |
| `deleteSection(id)` | DELETE /api/sections/:id |
| `moveSection(id, parentId)` | POST /api/sections/:id/move |
| `getItem(id)` | GET /api/items/:id |
| `createItem(sectionId, dto)` | POST /api/sections/:sectionId/items |
| `uploadItem(sectionId, file, title?)` | POST /api/sections/:sectionId/items/upload |
| `getFileUrl(fileId)` | GET /api/files/:fileId — URL для скачивания |
| `updateItem(id, dto)` | PATCH /api/items/:id |
| `deleteItem(id)` | DELETE /api/items/:id |
| `moveItem(id, sectionId)` | POST /api/items/:id/move |
| `search(query, limit?)` | GET /api/search?q=query |
| `quickSearch(query)` | GET /api/search/quick?q=query |

**Конфигурация:**
- Base URL: `VITE_API_URL` или `http://localhost:3000`
- Headers: `Content-Type: application/json`
- Authorization: `Bearer <token>` (если установлен)

---

## Telegram Web App SDK

### Используемые API

**MainButton:**
```typescript
webApp.MainButton.setText('Добавить');
webApp.MainButton.show();
webApp.MainButton.hide();
webApp.MainButton.onClick(callback);
webApp.MainButton.offClick(callback);
```

**BackButton:**
```typescript
webApp.BackButton.show();
webApp.BackButton.hide();
webApp.BackButton.onClick(callback);
webApp.BackButton.offClick(callback);
```

**HapticFeedback:**
```typescript
webApp.HapticFeedback.impactOccurred('medium');
webApp.HapticFeedback.notificationOccurred('success');
webApp.HapticFeedback.selectionChanged();
```

**Dialogs:**
```typescript
webApp.showAlert(message, callback);
webApp.showConfirm(message, callback);
webApp.showPopup(params, callback);  // Для меню в CollapsedBreadcrumbs
```

**Theme:**
```typescript
webApp.colorScheme  // 'light' | 'dark'
webApp.themeParams  // { bg_color, text_color, ... }
```

---

## Deep Links

### Формат deep link

Deep links передаются через `start_param` в формате `section_123`:

```
https://t.me/BotUsername/AppName?startapp=section_123
```

### Обработка в useTelegram

```typescript
const startParam = webApp?.initDataUnsafe?.start_param;

// Парсим start_param для deep links (формат: section_123)
const deepLinkSectionId = startParam?.startsWith('section_')
  ? parseInt(startParam.replace('section_', ''), 10)
  : null;
```

### Поток с deep link

```
1. Пользователь нажимает "Открыть раздел" в группе
       │
       ▼
2. Telegram открывает Mini App с startapp=section_456
       │
       ▼
3. useTelegram парсит deepLinkSectionId = 456
       │
       ▼
4. После авторизации App.tsx вызывает navigation.navigateTo(456)
       │
       ▼
5. Загружается раздел 456 с путём и контентом
       │
       ▼
6. Отображается SectionPage с хлебными крошками
```

---

## Навигация

### Структура навигации

```
App.tsx
    │
    ├── isSearchMode → SearchResults
    │
    ├── currentSection !== null → SectionPage
    │   │
    │   └── (может быть любой уровень вложенности)
    │
    └── currentSection === null → HomePage
```

### BackButton поведение

| Экран | BackButton | Действие |
|-------|------------|----------|
| HomePage | Скрыт | - |
| SectionPage (1 уровень) | Показан | → HomePage |
| SectionPage (N уровень) | Показан | → Предыдущий раздел из истории |

---

## Стейт-менеджмент

Используется локальный стейт React (useState) и кастомные хуки:

**App уровень:**
- `isAuthenticated`, `user`, `permissions` — через useAuth
- `currentSection`, `breadcrumbs`, `sections`, `items` — через useNavigation
- `searchQuery`, `searchResults`, `isSearchMode` — локальный стейт

**Страницы:**
- `showModal` — какой модал открыт
- `selectedItem` — выбранный item для просмотра

---

## Стилизация

### CSS подход
- Отдельные .css файлы для каждого компонента
- CSS переменные для темизации
- Telegram theme variables

### Темы Telegram
```css
:root {
  --bg-color: var(--tg-theme-bg-color, #ffffff);
  --text-color: var(--tg-theme-text-color, #000000);
  --hint-color: var(--tg-theme-hint-color, #999999);
  --link-color: var(--tg-theme-link-color, #2481cc);
  --button-color: var(--tg-theme-button-color, #2481cc);
  --button-text-color: var(--tg-theme-button-text-color, #ffffff);
  --secondary-bg-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
}
```

---

## Потоки данных

### Загрузка приложения

```
[Telegram открывает Mini App]
       │
       ▼
[main.tsx] → React.render(<App />)
       │
       ▼
[useTelegram] → tg.ready(), tg.expand() или создание mock
       │
       ▼
[useAuth.login] → apiClient.auth(initData)
       │
       ▼
[apiClient.setToken] + [apiClient.getMe] → permissions
       │
       ▼
[Проверка deepLinkSectionId]
       │
       ├── Есть → navigation.navigateTo(sectionId)
       │
       └── Нет → navigation.loadRootSections()
       │
       ▼
[Рендер страницы]
```

### Навигация в раздел

```
[Клик по SectionCard]
       │
       ▼
[navigation.navigateTo(sectionId)]
       │
       ▼
[apiClient.getSection(id)] → { section, children, items, path }
       │
       ▼
[Обновление состояния navigation]
       │
       ▼
[webApp.BackButton.show()]
       │
       ▼
[Рендер SectionPage]
```

### Создание контента

```
[BottomActions click → "Элемент"]
       │
       ▼
[Показать AddItemModal]
       │
       ▼
[Пользователь заполняет форму / загружает файл]
       │
       ▼
[apiClient.createItem или apiClient.uploadItem]
       │
       ▼
[HapticFeedback.notificationOccurred('success')]
       │
       ▼
[navigation.refresh()]
       │
       ▼
[Закрыть модал]
```

### Поиск

```
[Header: клик по иконке поиска]
       │
       ▼
[Input раскрывается, фокус]
       │
       ▼
[Ввод текста → handleSearch(query)]
       │
       ▼
[apiClient.search(query)]
       │
       ▼
[isSearchMode = true, показать SearchResults]
       │
       ▼
[Клик по результату]
       │
       ▼
[navigation.navigateTo(result.sectionId)]
       │
       ▼
[Сброс поиска, показ SectionPage]
```

---

## Локальная разработка

### Mock-режим

При запуске `npm run dev` без Telegram автоматически активируется mock-режим:

- Создаётся mock WebApp с тестовыми данными пользователя и группы
- `initData = 'mock_dev_mode'` — бэкенд должен обрабатывать этот случай
- MainButton рендерится как HTML кнопка внизу экрана
- HapticFeedback логируется в консоль
- Popup заменяется на browser prompt

### Запуск

```bash
cd frontend
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:5173`
