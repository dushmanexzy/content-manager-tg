import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Результат поиска — раздел
 */
export interface SectionSearchResult {
  type: 'section';
  id: number;
  title: string;
  parentId: number | null;
  path: string[]; // Путь от корня для навигации
}

/**
 * Результат поиска — элемент контента
 */
export interface ItemSearchResult {
  type: 'item';
  id: number;
  itemType: string; // 'text' | 'link' | 'file' | 'image'
  title: string | null;
  content: string | null;
  fileName: string | null;
  sectionId: number;
  sectionTitle: string;
  path: string[]; // Путь от корня до раздела
}

/**
 * Объединённый тип результата поиска
 */
export type SearchResult = SectionSearchResult | ItemSearchResult;

/**
 * SearchService — полнотекстовый поиск по пространству
 * Ищет по названиям разделов и содержимому элементов
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Поиск по пространству
   * @param spaceId ID пространства
   * @param query Поисковый запрос
   * @param limit Максимальное количество результатов
   */
  async search(
    spaceId: number,
    query: string,
    limit: number = 50,
  ): Promise<SearchResult[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    // Параллельный поиск по разделам и элементам
    const [sections, items] = await Promise.all([
      this.searchSections(spaceId, normalizedQuery, limit),
      this.searchItems(spaceId, normalizedQuery, limit),
    ]);

    // Объединяем и сортируем по релевантности (точное совпадение в начале)
    const results: SearchResult[] = [...sections, ...items];

    return results.slice(0, limit);
  }

  /**
   * Поиск по разделам
   */
  private async searchSections(
    spaceId: number,
    query: string,
    limit: number,
  ): Promise<SectionSearchResult[]> {
    // SQLite использует LIKE для поиска (для production лучше FTS)
    const sections = await this.prisma.section.findMany({
      where: {
        spaceId,
        title: {
          contains: query,
        },
      },
      take: limit,
      select: {
        id: true,
        title: true,
        parentId: true,
      },
    });

    // Добавляем путь к каждому результату
    const results: SectionSearchResult[] = [];
    for (const section of sections) {
      const path = await this.getSectionPath(section.id);
      results.push({
        type: 'section',
        id: section.id,
        title: section.title,
        parentId: section.parentId,
        path,
      });
    }

    return results;
  }

  /**
   * Поиск по элементам контента
   */
  private async searchItems(
    spaceId: number,
    query: string,
    limit: number,
  ): Promise<ItemSearchResult[]> {
    // Поиск по title, content и fileName
    const items = await this.prisma.item.findMany({
      where: {
        spaceId,
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { fileName: { contains: query } },
        ],
      },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        fileName: true,
        sectionId: true,
        section: {
          select: { title: true },
        },
      },
    });

    // Добавляем путь к каждому результату
    const results: ItemSearchResult[] = [];
    for (const item of items) {
      const path = await this.getSectionPath(item.sectionId);
      results.push({
        type: 'item',
        id: item.id,
        itemType: item.type,
        title: item.title,
        content: item.content,
        fileName: item.fileName,
        sectionId: item.sectionId,
        sectionTitle: item.section.title,
        path,
      });
    }

    return results;
  }

  /**
   * Получить путь от корня до раздела (для хлебных крошек)
   */
  private async getSectionPath(sectionId: number): Promise<string[]> {
    const path: string[] = [];
    let currentId: number | null = sectionId;

    while (currentId !== null) {
      const section = await this.prisma.section.findUnique({
        where: { id: currentId },
        select: { title: true, parentId: true },
      });

      if (!section) break;

      path.unshift(section.title);
      currentId = section.parentId;
    }

    return path;
  }

  /**
   * Быстрый поиск для автодополнения (только названия разделов)
   */
  async quickSearch(
    spaceId: number,
    query: string,
    limit: number = 10,
  ): Promise<{ id: number; title: string; type: 'section' | 'item' }[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const sections = await this.prisma.section.findMany({
      where: {
        spaceId,
        title: { contains: query },
      },
      take: limit,
      select: { id: true, title: true },
    });

    return sections.map((s) => ({
      id: s.id,
      title: s.title,
      type: 'section' as const,
    }));
  }
}
