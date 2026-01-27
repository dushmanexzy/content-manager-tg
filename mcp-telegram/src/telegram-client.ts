import { TELEGRAM_BOT_TOKEN, TELEGRAM_API_URL } from './config.js';
import type {
  TelegramUser,
  ChatMember,
  ChatInfo,
  Message,
  File,
  WebhookInfo,
  TelegramApiResponse,
  InlineKeyboardMarkup,
} from './types.js';

export class TelegramClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${TELEGRAM_API_URL}/bot${TELEGRAM_BOT_TOKEN}`;
  }

  private async apiRequest<T>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }

    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = (await response.json()) as TelegramApiResponse<T>;

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.error_code} - ${data.description}`);
    }

    return data.result as T;
  }

  // Bot Management
  async getMe(): Promise<TelegramUser> {
    return this.apiRequest<TelegramUser>('getMe');
  }

  async setWebhook(
    url: string,
    options?: {
      certificate?: string;
      ip_address?: string;
      max_connections?: number;
      allowed_updates?: string[];
      drop_pending_updates?: boolean;
      secret_token?: string;
    }
  ): Promise<boolean> {
    return this.apiRequest<boolean>('setWebhook', { url, ...options });
  }

  async deleteWebhook(dropPendingUpdates?: boolean): Promise<boolean> {
    return this.apiRequest<boolean>('deleteWebhook', {
      drop_pending_updates: dropPendingUpdates,
    });
  }

  async getWebhookInfo(): Promise<WebhookInfo> {
    return this.apiRequest<WebhookInfo>('getWebhookInfo');
  }

  // Messages
  async sendMessage(
    chatId: string | number,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      disable_web_page_preview?: boolean;
      disable_notification?: boolean;
      reply_to_message_id?: number;
      reply_markup?: InlineKeyboardMarkup;
    }
  ): Promise<Message> {
    return this.apiRequest<Message>('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  async editMessageText(
    chatId: string | number,
    messageId: number,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      disable_web_page_preview?: boolean;
      reply_markup?: InlineKeyboardMarkup;
    }
  ): Promise<Message | boolean> {
    return this.apiRequest<Message | boolean>('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options,
    });
  }

  async deleteMessage(chatId: string | number, messageId: number): Promise<boolean> {
    return this.apiRequest<boolean>('deleteMessage', {
      chat_id: chatId,
      message_id: messageId,
    });
  }

  async forwardMessage(
    chatId: string | number,
    fromChatId: string | number,
    messageId: number,
    options?: {
      disable_notification?: boolean;
    }
  ): Promise<Message> {
    return this.apiRequest<Message>('forwardMessage', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
      ...options,
    });
  }

  // Chat Operations
  async getChat(chatId: string | number): Promise<ChatInfo> {
    return this.apiRequest<ChatInfo>('getChat', { chat_id: chatId });
  }

  async getChatMember(chatId: string | number, userId: number): Promise<ChatMember> {
    return this.apiRequest<ChatMember>('getChatMember', {
      chat_id: chatId,
      user_id: userId,
    });
  }

  async getChatAdministrators(chatId: string | number): Promise<ChatMember[]> {
    return this.apiRequest<ChatMember[]>('getChatAdministrators', {
      chat_id: chatId,
    });
  }

  async banChatMember(
    chatId: string | number,
    userId: number,
    options?: {
      until_date?: number;
      revoke_messages?: boolean;
    }
  ): Promise<boolean> {
    return this.apiRequest<boolean>('banChatMember', {
      chat_id: chatId,
      user_id: userId,
      ...options,
    });
  }

  async unbanChatMember(
    chatId: string | number,
    userId: number,
    onlyIfBanned?: boolean
  ): Promise<boolean> {
    return this.apiRequest<boolean>('unbanChatMember', {
      chat_id: chatId,
      user_id: userId,
      only_if_banned: onlyIfBanned,
    });
  }

  // Files
  async sendPhoto(
    chatId: string | number,
    photo: string, // file_id or URL
    options?: {
      caption?: string;
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      disable_notification?: boolean;
      reply_to_message_id?: number;
      reply_markup?: InlineKeyboardMarkup;
    }
  ): Promise<Message> {
    return this.apiRequest<Message>('sendPhoto', {
      chat_id: chatId,
      photo,
      ...options,
    });
  }

  async sendDocument(
    chatId: string | number,
    document: string, // file_id or URL
    options?: {
      caption?: string;
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      disable_notification?: boolean;
      reply_to_message_id?: number;
      reply_markup?: InlineKeyboardMarkup;
    }
  ): Promise<Message> {
    return this.apiRequest<Message>('sendDocument', {
      chat_id: chatId,
      document,
      ...options,
    });
  }

  async getFile(fileId: string): Promise<File> {
    return this.apiRequest<File>('getFile', { file_id: fileId });
  }

  getFileUrl(filePath: string): string {
    return `${TELEGRAM_API_URL}/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  }
}

export const telegramClient = new TelegramClient();
