import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * SpaceService — управление пространствами (группами)
 * Space создаётся автоматически при первом открытии Mini App из группы
 */
@Injectable()
export class SpaceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Поиск пространства по Telegram chat_id
   */
  async findByChatId(chatId: string) {
    return this.prisma.space.findUnique({
      where: { chatId },
    });
  }

  /**
   * Поиск пространства по внутреннему ID
   */
  async findById(id: number) {
    return this.prisma.space.findUnique({
      where: { id },
    });
  }

  /**
   * Найти или создать пространство для группы
   * Используется при авторизации через Mini App
   */
  async findOrCreate(chatId: string, title?: string) {
    // Пробуем найти существующее
    const existing = await this.findByChatId(chatId);
    if (existing) {
      // Обновляем title если передан и изменился
      if (title && existing.title !== title) {
        return this.prisma.space.update({
          where: { id: existing.id },
          data: { title },
        });
      }
      return existing;
    }

    // Создаём новое пространство
    return this.prisma.space.create({
      data: {
        chatId,
        title,
      },
    });
  }

  /**
   * Обновить название пространства (кэш из Telegram)
   */
  async updateTitle(id: number, title: string) {
    return this.prisma.space.update({
      where: { id },
      data: { title },
    });
  }

  /**
   * Удалить пространство (при удалении бота из группы)
   * Каскадно удалит все разделы и контент
   */
  async delete(id: number) {
    return this.prisma.space.delete({
      where: { id },
    });
  }

  /**
   * Удалить пространство по chat_id
   */
  async deleteByChatId(chatId: string) {
    return this.prisma.space.delete({
      where: { chatId },
    });
  }
}
