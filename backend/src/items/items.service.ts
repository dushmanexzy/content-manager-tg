import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Типы контента
 * text - текстовая заметка
 * link - ссылка
 * file - файл
 * image - изображение
 */
export type ItemType = 'text' | 'link' | 'file' | 'image';

/**
 * DTO для создания элемента контента
 */
export interface CreateItemDto {
  type: ItemType;
  title?: string | null; // Название элемента
  content?: string | null; // Текст или URL
  fileId?: string | null; // Telegram file_id для файлов/изображений
  fileName?: string | null; // Имя файла для отображения
  fileSize?: number | null; // Размер файла
  mimeType?: string | null; // MIME-тип
}

/**
 * DTO для обновления элемента
 */
export interface UpdateItemDto {
  title?: string | null;
  content?: string | null;
  order?: number;
}

/**
 * ItemsService — управление контентом внутри разделов
 * Поддерживает типы: text, link, file, image
 */
@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить все элементы раздела
   */
  async getBySectionId(sectionId: number) {
    return this.prisma.item.findMany({
      where: { sectionId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
    });
  }

  /**
   * Получить элемент по ID
   */
  async getById(id: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        section: {
          select: { id: true, title: true, spaceId: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Item ${id} not found`);
    }

    return item;
  }

  /**
   * Создать новый элемент в разделе
   */
  async create(sectionId: number, dto: CreateItemDto, createdById?: number) {
    // Получаем spaceId из раздела
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { spaceId: true },
    });

    if (!section) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    // Определяем order для нового элемента
    const lastItem = await this.prisma.item.findFirst({
      where: { sectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = (lastItem?.order ?? -1) + 1;

    return this.prisma.item.create({
      data: {
        type: dto.type,
        title: dto.title,
        content: dto.content,
        fileId: dto.fileId,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        order,
        sectionId,
        spaceId: section.spaceId,
        createdById,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
    });
  }

  /**
   * Обновить элемент
   */
  async update(id: number, dto: UpdateItemDto) {
    const existing = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Item ${id} not found`);
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        order: dto.order,
      },
    });
  }

  /**
   * Удалить элемент
   */
  async delete(id: number) {
    const existing = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Item ${id} not found`);
    }

    return this.prisma.item.delete({
      where: { id },
    });
  }

  /**
   * Переместить элемент в другой раздел
   */
  async move(id: number, newSectionId: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${id} not found`);
    }

    // Получаем spaceId нового раздела
    const section = await this.prisma.section.findUnique({
      where: { id: newSectionId },
      select: { spaceId: true },
    });

    if (!section) {
      throw new NotFoundException(`Section ${newSectionId} not found`);
    }

    // Определяем order в новом разделе
    const lastItem = await this.prisma.item.findFirst({
      where: { sectionId: newSectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = (lastItem?.order ?? -1) + 1;

    return this.prisma.item.update({
      where: { id },
      data: {
        sectionId: newSectionId,
        spaceId: section.spaceId,
        order,
      },
    });
  }

  /**
   * Изменить порядок элементов в разделе
   * @param sectionId ID раздела
   * @param itemIds Массив ID элементов в новом порядке
   */
  async reorder(sectionId: number, itemIds: number[]) {
    // Обновляем order для каждого элемента
    const updates = itemIds.map((itemId, index) =>
      this.prisma.item.update({
        where: { id: itemId },
        data: { order: index },
      }),
    );

    return this.prisma.$transaction(updates);
  }

  /**
   * Проверить, принадлежит ли элемент разделу из конкретного пространства
   */
  async belongsToSpace(itemId: number, spaceId: number): Promise<boolean> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { spaceId: true },
    });

    return item?.spaceId === spaceId;
  }

  /**
   * Проверить, является ли пользователь автором элемента
   */
  async isCreatedBy(itemId: number, userId: number): Promise<boolean> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { createdById: true },
    });

    return item?.createdById === userId;
  }

  /**
   * Получить ID раздела, которому принадлежит элемент
   */
  async getSectionId(itemId: number): Promise<number | null> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { sectionId: true },
    });

    return item?.sectionId ?? null;
  }
}
