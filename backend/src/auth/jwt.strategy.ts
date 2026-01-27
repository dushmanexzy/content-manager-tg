import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from './auth.service';
import { ChatMemberStatus } from '../telegram/telegram-api.service';

/**
 * Данные пользователя, добавляемые в request после JWT валидации
 * Доступны через @Request() req в контроллерах: req.user
 */
export interface AuthenticatedUser {
  id: number; // Внутренний User ID
  telegramId: string; // Telegram user ID
  spaceId: number; // Space ID текущей группы
  chatId: string; // Telegram chat_id группы
  role: ChatMemberStatus; // Роль в группе на момент авторизации
  // Данные из БД
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * JWT Strategy для Passport.js
 * Валидирует токен и добавляет данные пользователя в request
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  /**
   * Валидация JWT payload
   * Вызывается после успешной проверки подписи токена
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Проверяем, существует ли пользователь
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Возвращаем объединённые данные из токена и БД
    return {
      id: user.id,
      telegramId: user.telegramId,
      spaceId: payload.spaceId,
      chatId: payload.chatId,
      role: payload.role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
