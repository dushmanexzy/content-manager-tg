import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// DTO для создания раздела
export interface CreateSectionDto {
  title: string;
  parentId?: number | null; // null = корневой раздел
}

// DTO для обновления раздела
export interface UpdateSectionDto {
  title?: string;
  order?: number;
  parentId?: number | null; // Перемещение в другой раздел
}

// Хлебная крошка для навигации
export interface Breadcrumb {
  id: number;
  title: string;
}

/**
 * SectionsService — управление разделами с вложенностью
 * Разделы принадлежат Space и могут иметь неограниченную вложенность
 */
@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить корневые разделы пространства (parentId = null)
   */
  async getRootSections(spaceId: number) {
    return this.prisma.section.findMany({
      where: {
        spaceId,
        parentId: null,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { children: true, items: true },
        },
      },
    });
  }

  /**
   * Получить дочерние разделы
   */
  async getChildren(parentId: number) {
    return this.prisma.section.findMany({
      where: { parentId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { children: true, items: true },
        },
      },
    });
  }

  /**
   * Получить раздел по ID с дочерними разделами и контентом
   */
  async getById(id: number) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          include: {
            _count: {
              select: { children: true, items: true },
            },
          },
        },
        items: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section ${id} not found`);
    }

    return section;
  }

  /**
   * Получить путь до раздела (хлебные крошки)
   * Возвращает массив от корня до текущего раздела
   */
  async getPath(sectionId: number): Promise<Breadcrumb[]> {
    const path: Breadcrumb[] = [];
    let currentId: number | null = sectionId;

    // Идём вверх по дереву до корня
    while (currentId !== null) {
      const section = await this.prisma.section.findUnique({
        where: { id: currentId },
        select: { id: true, title: true, parentId: true },
      });

      if (!section) break;

      path.unshift({ id: section.id, title: section.title });
      currentId = section.parentId;
    }

    return path;
  }

  /**
   * Создать новый раздел
   */
  async create(spaceId: number, dto: CreateSectionDto, createdById?: number) {
    // Определяем order для нового раздела
    const lastSection = await this.prisma.section.findFirst({
      where: {
        spaceId,
        parentId: dto.parentId ?? null,
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = (lastSection?.order ?? -1) + 1;

    return this.prisma.section.create({
      data: {
        title: dto.title,
        order,
        spaceId,
        parentId: dto.parentId ?? null,
        createdById,
      },
      include: {
        _count: {
          select: { children: true, items: true },
        },
      },
    });
  }

  /**
   * Обновить раздел
   */
  async update(id: number, dto: UpdateSectionDto) {
    // Проверяем существование
    const existing = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Section ${id} not found`);
    }

    return this.prisma.section.update({
      where: { id },
      data: {
        title: dto.title,
        order: dto.order,
        parentId: dto.parentId,
      },
    });
  }

  /**
   * Удалить раздел (каскадно удалит всех потомков и контент)
   */
  async delete(id: number) {
    // Проверяем существование
    const existing = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Section ${id} not found`);
    }

    return this.prisma.section.delete({
      where: { id },
    });
  }

  /**
   * Переместить раздел в другой родительский раздел
   */
  async move(id: number, newParentId: number | null) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      select: { spaceId: true },
    });

    if (!section) {
      throw new NotFoundException(`Section ${id} not found`);
    }

    // Проверяем, что не перемещаем в самого себя или своего потомка
    if (newParentId !== null) {
      const isDescendant = await this.isDescendantOf(newParentId, id);
      if (isDescendant || newParentId === id) {
        throw new Error('Cannot move section into itself or its descendant');
      }
    }

    // Определяем order в новом месте
    const lastSection = await this.prisma.section.findFirst({
      where: {
        spaceId: section.spaceId,
        parentId: newParentId,
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = (lastSection?.order ?? -1) + 1;

    return this.prisma.section.update({
      where: { id },
      data: {
        parentId: newParentId,
        order,
      },
    });
  }

  /**
   * Проверить, является ли раздел потомком другого
   */
  private async isDescendantOf(
    sectionId: number,
    ancestorId: number,
  ): Promise<boolean> {
    let currentId: number | null = sectionId;

    while (currentId !== null) {
      if (currentId === ancestorId) return true;

      const section = await this.prisma.section.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      currentId = section?.parentId ?? null;
    }

    return false;
  }

  /**
   * Проверить, принадлежит ли раздел пространству
   */
  async belongsToSpace(sectionId: number, spaceId: number): Promise<boolean> {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { spaceId: true },
    });

    return section?.spaceId === spaceId;
  }

  /**
   * Проверить, является ли пользователь автором раздела
   */
  async isCreatedBy(sectionId: number, userId: number): Promise<boolean> {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { createdById: true },
    });

    return section?.createdById === userId;
  }
}
