import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PermissionsGuard } from './permissions.guard';
import { UserModule } from '../user/user.module';
import { SpaceModule } from '../space/space.module';
import { TelegramModule } from '../telegram/telegram.module';

/**
 * AuthModule — авторизация и права доступа
 *
 * Компоненты:
 * - AuthService: авторизация через Telegram initData
 * - JwtStrategy: валидация JWT токенов
 * - PermissionsGuard: проверка прав доступа в группе
 */
@Module({
  imports: [
    UserModule,
    SpaceModule,
    TelegramModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionsGuard],
  exports: [AuthService, PermissionsGuard],
})
export class AuthModule {}
