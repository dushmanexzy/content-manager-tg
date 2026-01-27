import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'crypto';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';
import {
  TelegramApiService,
  ChatMemberStatus,
} from '../telegram/telegram-api.service';

// Telegram user из initData
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// Telegram chat из initData (когда Mini App открыт из группы)
interface TelegramChat {
  id: number;
  type: 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
}

// Распарсенные данные initData
interface ParsedInitData {
  user?: TelegramUser;
  chat?: TelegramChat; // Присутствует если открыто из группы
  chat_type?: string;
  chat_instance?: string;
  start_param?: string; // Параметр из t.me/bot/app?startapp=XXX
  auth_date: number;
  hash: string;
  [key: string]: unknown;
}

// JWT payload структура
export interface JwtPayload {
  sub: number; // User ID
  telegramId: string; // Telegram user ID
  spaceId: number; // Space ID
  chatId: string; // Telegram chat_id группы
  role: ChatMemberStatus; // Роль в группе
}

// Ответ авторизации
export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  space: {
    id: number;
    chatId: string;
    title?: string | null;
  };
  role: ChatMemberStatus;
}

/**
 * AuthService — авторизация через Telegram Mini App
 * Проверяет initData, создаёт/обновляет User и Space, выдаёт JWT
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly spaceService: SpaceService,
    private readonly telegramApi: TelegramApiService,
  ) {}

  /**
   * Авторизация через Telegram initData
   * Возвращает JWT токен, данные пользователя и пространства
   */
  async authenticateWithTelegram(initData: string): Promise<AuthResponse> {
    // Mock режим для локальной разработки
    if (initData === 'mock_dev_mode') {
      return this.handleMockAuth();
    }

    const parsed = this.parseInitData(initData);

    // Проверка подписи
    if (!this.verifyInitData(initData)) {
      this.logger.warn('Invalid Telegram initData signature');
      throw new UnauthorizedException('Invalid Telegram authentication');
    }

    // Проверка свежести (не старше 1 часа)
    const authDate = parsed.auth_date * 1000;
    const maxAge = 60 * 60 * 1000;
    if (Date.now() - authDate > maxAge) {
      this.logger.warn('Telegram auth_date is too old');
      throw new UnauthorizedException('Authentication expired');
    }

    // Проверка наличия данных пользователя
    if (!parsed.user) {
      throw new UnauthorizedException('User data not found in initData');
    }

    // Определяем chat_id: из chat объекта или из start_param
    let chatId: string;
    let chatTitle: string | undefined;

    if (parsed.chat) {
      // Mini App открыт напрямую из группы
      chatId = String(parsed.chat.id);
      chatTitle = parsed.chat.title;
    } else if (parsed.start_param) {
      // Mini App открыт через ссылку с startapp параметром
      // Формат: chatId или chatId_section_sectionId
      const parts = parsed.start_param.split('_section_');
      const potentialChatId = parts[0];

      if (/^-?\d+$/.test(potentialChatId)) {
        chatId = potentialChatId;
        chatTitle = undefined;
      } else {
        throw new UnauthorizedException(
          'Chat data not found. Mini App must be opened from a group.',
        );
      }
    } else {
      throw new UnauthorizedException(
        'Chat data not found. Mini App must be opened from a group.',
      );
    }

    // Создаём/обновляем пользователя
    const user = await this.userService.findOrCreateByTelegram({
      telegramId: String(parsed.user.id),
      username: parsed.user.username,
      firstName: parsed.user.first_name,
      lastName: parsed.user.last_name,
    });

    // Создаём/обновляем пространство для группы
    const space = await this.spaceService.findOrCreate(chatId, chatTitle);

    // Проверяем членство в группе через Telegram API
    const member = await this.telegramApi.getChatMember(
      chatId,
      parsed.user.id,
    );

    if (!member) {
      this.logger.warn(
        `Failed to get chat member status for user ${parsed.user.id} in chat ${chatId}`,
      );
      throw new UnauthorizedException('Failed to verify group membership');
    }

    // Проверяем, что пользователь имеет доступ
    if (['left', 'kicked'].includes(member.status)) {
      throw new UnauthorizedException('You are not a member of this group');
    }

    // Генерируем JWT с расширенным payload
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      spaceId: space.id,
      chatId: space.chatId,
      role: member.status,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      space: {
        id: space.id,
        chatId: space.chatId,
        title: space.title,
      },
      role: member.status,
    };
  }

  /**
   * Mock авторизация для локальной разработки
   * Создаёт тестового пользователя и пространство
   */
  private async handleMockAuth(): Promise<AuthResponse> {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Mock auth not allowed in production');
    }

    // Mock данные
    const mockTelegramId = '123456789';
    const mockChatId = '-1001234567890';

    // Создаём/получаем mock пользователя
    const user = await this.userService.findOrCreateByTelegram({
      telegramId: mockTelegramId,
      username: 'devuser',
      firstName: 'Dev',
      lastName: 'User',
    });

    // Создаём/получаем mock пространство
    const space = await this.spaceService.findOrCreate(
      mockChatId,
      'Dev Test Group',
    );

    // Mock роль — администратор для полного доступа
    const mockRole: ChatMemberStatus = 'administrator';

    // Генерируем JWT
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      spaceId: space.id,
      chatId: space.chatId,
      role: mockRole,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      space: {
        id: space.id,
        chatId: space.chatId,
        title: space.title,
      },
      role: mockRole,
    };
  }

  /**
   * Парсинг initData из URL-encoded строки
   */
  private parseInitData(initData: string): ParsedInitData {
    const params = new URLSearchParams(initData);
    const result: Record<string, unknown> = {};

    for (const [key, value] of params.entries()) {
      // JSON поля: user, chat
      if (key === 'user' || key === 'chat') {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      } else if (key === 'auth_date') {
        result.auth_date = parseInt(value, 10);
      } else {
        result[key] = value;
      }
    }

    return result as ParsedInitData;
  }

  /**
   * Проверка HMAC-SHA256 подписи initData
   */
  private verifyInitData(initData: string): boolean {
    if (!this.botToken) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN is not set, skipping verification in dev mode',
      );
      return process.env.NODE_ENV !== 'production';
    }

    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');

      if (!hash) return false;

      // Удаляем hash из параметров
      params.delete('hash');

      // Сортируем и формируем data-check-string
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Вычисляем secret key и hash
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();

      const calculatedHash = createHmac('sha256', secretKey)
        .update(sortedParams)
        .digest('hex');

      return calculatedHash === hash;
    } catch (error) {
      this.logger.error('Error verifying initData', error);
      return false;
    }
  }

  /**
   * Валидация пользователя по ID (используется JWT Strategy)
   */
  async validateUser(userId: number) {
    return this.userService.findById(userId);
  }
}
