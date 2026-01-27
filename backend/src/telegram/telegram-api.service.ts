import { Injectable, Logger } from '@nestjs/common';

/**
 * Статус участника группы в Telegram
 */
export type ChatMemberStatus =
  | 'creator' // Владелец группы
  | 'administrator' // Администратор
  | 'member' // Обычный участник
  | 'restricted' // Ограниченный участник
  | 'left' // Вышел из группы
  | 'kicked'; // Заблокирован

/**
 * Информация об участнике группы
 */
export interface ChatMember {
  status: ChatMemberStatus;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  // Дополнительные поля для администраторов
  can_manage_chat?: boolean;
  can_delete_messages?: boolean;
  can_restrict_members?: boolean;
}

/**
 * Информация о чате
 */
export interface ChatInfo {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  description?: string;
}

/**
 * TelegramApiService — низкоуровневый сервис для Telegram Bot API
 * Отвечает за прямые вызовы API: getChatMember, getChat и т.д.
 */
@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);
  private readonly apiUrl =
    process.env.TELEGRAM_API_URL ?? 'https://api.telegram.org';
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';

  constructor() {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set');
    }
  }

  private get baseUrl() {
    return `${this.apiUrl}/bot${this.botToken}`;
  }

  /**
   * Выполнить запрос к Telegram Bot API
   */
  private async apiRequest<T>(
    method: string,
    params: Record<string, unknown>,
  ): Promise<T | null> {
    if (!this.botToken) {
      this.logger.error(`Cannot call ${method}: TELEGRAM_BOT_TOKEN is empty`);
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!data.ok) {
        this.logger.error(
          `Telegram API ${method} error: ${data.error_code} - ${data.description}`,
        );
        return null;
      }

      return data.result as T;
    } catch (error) {
      this.logger.error(`Telegram API ${method} exception: ${error}`);
      return null;
    }
  }

  /**
   * Получить информацию об участнике группы
   * Используется для проверки прав доступа
   */
  async getChatMember(
    chatId: string | number,
    userId: string | number,
  ): Promise<ChatMember | null> {
    return this.apiRequest<ChatMember>('getChatMember', {
      chat_id: chatId,
      user_id: userId,
    });
  }

  /**
   * Получить информацию о чате
   */
  async getChat(chatId: string | number): Promise<ChatInfo | null> {
    return this.apiRequest<ChatInfo>('getChat', {
      chat_id: chatId,
    });
  }

  /**
   * Отправить сообщение
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      reply_markup?: unknown;
    },
  ) {
    return this.apiRequest<unknown>('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  /**
   * Ответить на callback query (подтвердить нажатие кнопки)
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string) {
    return this.apiRequest<boolean>('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  /**
   * Редактировать текст сообщения
   */
  async editMessageText(
    chatId: string | number,
    messageId: number,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      reply_markup?: unknown;
    },
  ) {
    return this.apiRequest<unknown>('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options,
    });
  }

  /**
   * Проверить, может ли пользователь писать в группу
   * На основе статуса участника
   */
  canWrite(status: ChatMemberStatus): boolean {
    return ['creator', 'administrator', 'member'].includes(status);
  }

  /**
   * Проверить, может ли пользователь удалять контент других
   * Только владелец и администраторы
   */
  canDeleteOthers(status: ChatMemberStatus): boolean {
    return ['creator', 'administrator'].includes(status);
  }

  /**
   * Отправить фото в чат
   * Возвращает message с file_id
   */
  async sendPhoto(
    chatId: string | number,
    photo: Buffer,
    options?: {
      caption?: string;
      filename?: string;
      reply_markup?: unknown;
    },
  ): Promise<{ message_id: number; photo: Array<{ file_id: string; file_size?: number }> } | null> {
    if (!this.botToken) {
      this.logger.error('Cannot send photo: TELEGRAM_BOT_TOKEN is empty');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      formData.append('photo', new Blob([new Uint8Array(photo)]), options?.filename || 'photo.jpg');
      if (options?.caption) {
        formData.append('caption', options.caption);
      }
      if (options?.reply_markup) {
        formData.append('reply_markup', JSON.stringify(options.reply_markup));
      }

      const response = await fetch(`${this.baseUrl}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.ok) {
        this.logger.error(`sendPhoto error: ${data.error_code} - ${data.description}`);
        return null;
      }

      return data.result;
    } catch (error) {
      this.logger.error(`sendPhoto exception: ${error}`);
      return null;
    }
  }

  /**
   * Отправить документ в чат
   * Возвращает message с file_id
   */
  async sendDocument(
    chatId: string | number,
    document: Buffer,
    options?: {
      caption?: string;
      filename?: string;
      reply_markup?: unknown;
    },
  ): Promise<{ message_id: number; document: { file_id: string; file_name?: string; file_size?: number; mime_type?: string } } | null> {
    if (!this.botToken) {
      this.logger.error('Cannot send document: TELEGRAM_BOT_TOKEN is empty');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      formData.append('document', new Blob([new Uint8Array(document)]), options?.filename || 'file');
      if (options?.caption) {
        formData.append('caption', options.caption);
      }
      if (options?.reply_markup) {
        formData.append('reply_markup', JSON.stringify(options.reply_markup));
      }

      const response = await fetch(`${this.baseUrl}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.ok) {
        this.logger.error(`sendDocument error: ${data.error_code} - ${data.description}`);
        return null;
      }

      return data.result;
    } catch (error) {
      this.logger.error(`sendDocument exception: ${error}`);
      return null;
    }
  }

  /**
   * Получить информацию о файле по file_id
   * Возвращает file_path для скачивания
   */
  async getFile(fileId: string): Promise<{ file_id: string; file_path?: string; file_size?: number } | null> {
    return this.apiRequest<{ file_id: string; file_path?: string; file_size?: number }>('getFile', {
      file_id: fileId,
    });
  }

  /**
   * Получить URL для скачивания файла
   */
  getFileUrl(filePath: string): string {
    return `${this.apiUrl}/file/bot${this.botToken}/${filePath}`;
  }
}
