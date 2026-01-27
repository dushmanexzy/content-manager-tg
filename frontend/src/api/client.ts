import type {
  Section,
  SectionWithContent,
  Item,
  AuthResponse,
  MeResponse,
  CreateSectionDto,
  UpdateSectionDto,
  CreateItemDto,
  UpdateItemDto,
  SearchResult,
  QuickSearchResult,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API клиент для взаимодействия с бэкендом
 * Singleton — используется через экспортированный экземпляр apiClient
 */
class ApiClient {
  private token: string | null = null;

  /**
   * Установить JWT токен для авторизованных запросов
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Базовый метод для HTTP запросов
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Для DELETE запросов может не быть body
    const text = await response.text();
    return text ? JSON.parse(text) : (null as T);
  }

  // ============================================================================
  // Auth — авторизация
  // ============================================================================

  /**
   * Авторизация через Telegram initData
   */
  async auth(initData: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  }

  /**
   * Получить данные текущего пользователя и права
   */
  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/api/me');
  }

  // ============================================================================
  // Sections — разделы
  // ============================================================================

  /**
   * Получить корневые разделы пространства
   */
  async getSections(): Promise<Section[]> {
    return this.request<Section[]>('/api/sections');
  }

  /**
   * Получить раздел с дочерними разделами и контентом
   */
  async getSection(id: number): Promise<SectionWithContent> {
    return this.request<SectionWithContent>(`/api/sections/${id}`);
  }

  /**
   * Получить дочерние разделы
   */
  async getSectionChildren(id: number): Promise<Section[]> {
    return this.request<Section[]>(`/api/sections/${id}/children`);
  }

  /**
   * Создать новый раздел
   */
  async createSection(dto: CreateSectionDto): Promise<Section> {
    return this.request<Section>('/api/sections', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * Обновить раздел
   */
  async updateSection(id: number, dto: UpdateSectionDto): Promise<Section> {
    return this.request<Section>(`/api/sections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  /**
   * Удалить раздел
   */
  async deleteSection(id: number): Promise<void> {
    return this.request(`/api/sections/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Переместить раздел в другой родительский раздел
   */
  async moveSection(id: number, parentId: number | null): Promise<Section> {
    return this.request<Section>(`/api/sections/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ parentId }),
    });
  }

  // ============================================================================
  // Items — контент
  // ============================================================================

  /**
   * Получить элемент контента
   */
  async getItem(id: number): Promise<Item> {
    return this.request<Item>(`/api/items/${id}`);
  }

  /**
   * Создать элемент в разделе
   */
  async createItem(sectionId: number, dto: CreateItemDto): Promise<Item> {
    return this.request<Item>(`/api/sections/${sectionId}/items`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  /**
   * Загрузить файл и создать элемент
   */
  async uploadItem(sectionId: number, file: File, title?: string): Promise<Item> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}/api/sections/${sectionId}/items/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Получить URL для скачивания файла по file_id
   */
  async getFileUrl(fileId: string): Promise<string> {
    const result = await this.request<{ url: string }>(`/api/files/${fileId}`);
    return result.url;
  }

  /**
   * Обновить элемент
   */
  async updateItem(id: number, dto: UpdateItemDto): Promise<Item> {
    return this.request<Item>(`/api/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  /**
   * Удалить элемент
   */
  async deleteItem(id: number): Promise<void> {
    return this.request(`/api/items/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Переместить элемент в другой раздел
   */
  async moveItem(id: number, sectionId: number): Promise<Item> {
    return this.request<Item>(`/api/items/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ sectionId }),
    });
  }

  // ============================================================================
  // Search — поиск
  // ============================================================================

  /**
   * Полнотекстовый поиск по пространству
   */
  async search(query: string, limit: number = 50): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (limit !== 50) {
      params.set('limit', String(limit));
    }
    return this.request<SearchResult[]>(`/api/search?${params}`);
  }

  /**
   * Быстрый поиск для автодополнения
   */
  async quickSearch(query: string): Promise<QuickSearchResult[]> {
    const params = new URLSearchParams({ q: query });
    return this.request<QuickSearchResult[]>(`/api/search/quick?${params}`);
  }
}

export const apiClient = new ApiClient();
