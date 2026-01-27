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

// Раздел с полными данными (дети + контент)
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
// DTO — объекты для создания/обновления
// ============================================================================
export interface CreateSectionDto {
  title: string;
  parentId?: number | null;
}

export interface UpdateSectionDto {
  title?: string;
  order?: number;
  parentId?: number | null;
}

export interface CreateItemDto {
  type: ItemType;
  title?: string | null;
  content?: string | null;
  fileId?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}

export interface UpdateItemDto {
  title?: string | null;
  content?: string | null;
  order?: number;
}

// ============================================================================
// Quick Search — для автодополнения
// ============================================================================
export interface QuickSearchResult {
  id: number;
  title: string;
  type: 'section' | 'item';
}

// ============================================================================
// Telegram WebApp Types
// ============================================================================
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat?: {
      id: number;
      type: string;
      title?: string;
    };
    start_param?: string;
    auth_date: number;
    hash: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  platform?: string;
  version?: string;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  // Отключение вертикальных свайпов (сворачивание приложения)
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup: (
    params: {
      title?: string;
      message: string;
      buttons: Array<{
        id: string;
        type: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
        text: string;
      }>;
    },
    callback?: (buttonId: string) => void
  ) => void;
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}
