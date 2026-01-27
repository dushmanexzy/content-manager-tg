import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  TelegramApiService,
  ChatMemberStatus,
} from '../telegram/telegram-api.service';
import { AuthenticatedUser } from './jwt.strategy';

/**
 * Права доступа, добавляемые в request
 * Доступны через req.permissions в контроллерах
 */
export interface Permissions {
  canRead: boolean; // Может просматривать контент
  canWrite: boolean; // Может создавать/редактировать свой контент
  canDeleteOwn: boolean; // Может удалять свой контент
  canDeleteOthers: boolean; // Может удалять чужой контент (админ)
  canManage: boolean; // Может управлять разделами (админ)
}

/**
 * Расширение Express Request с данными авторизации
 */
export interface AuthenticatedRequest {
  user: AuthenticatedUser;
  permissions: Permissions;
}

/**
 * PermissionsGuard — проверка прав доступа в группе
 *
 * Использует роль из JWT токена для быстрой проверки.
 * Для критичных операций можно добавить realtime проверку через getChatMember.
 *
 * Использование:
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly telegramApi: TelegramApiService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Определяем права на основе роли из JWT
    // Роль сохранена в токене при авторизации
    const permissions = this.getPermissionsByRole(user.role);

    // Добавляем permissions в request для использования в контроллерах
    request.permissions = permissions;

    // Проверяем минимальные права (может читать)
    if (!permissions.canRead) {
      throw new ForbiddenException('You do not have access to this group');
    }

    return true;
  }

  /**
   * Определить права на основе статуса в группе
   */
  private getPermissionsByRole(status: ChatMemberStatus): Permissions {
    switch (status) {
      case 'creator':
      case 'administrator':
        // Полные права
        return {
          canRead: true,
          canWrite: true,
          canDeleteOwn: true,
          canDeleteOthers: true,
          canManage: true,
        };

      case 'member':
        // Обычный участник: может создавать и удалять своё
        return {
          canRead: true,
          canWrite: true,
          canDeleteOwn: true,
          canDeleteOthers: false,
          canManage: false,
        };

      case 'restricted':
        // Ограниченный: только чтение
        return {
          canRead: true,
          canWrite: false,
          canDeleteOwn: false,
          canDeleteOthers: false,
          canManage: false,
        };

      case 'left':
      case 'kicked':
      default:
        // Нет доступа
        return {
          canRead: false,
          canWrite: false,
          canDeleteOwn: false,
          canDeleteOthers: false,
          canManage: false,
        };
    }
  }

  /**
   * Проверить права в реальном времени через Telegram API
   * Использовать для критичных операций (удаление, управление)
   */
  async refreshPermissions(
    chatId: string,
    telegramId: string,
  ): Promise<Permissions> {
    const member = await this.telegramApi.getChatMember(chatId, telegramId);

    if (!member) {
      return this.getPermissionsByRole('left');
    }

    return this.getPermissionsByRole(member.status);
  }
}
