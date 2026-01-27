import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { SpaceModule } from './space/space.module';
import { SectionsModule } from './sections/sections.module';
import { ItemsModule } from './items/items.module';
import { SearchModule } from './search/search.module';
import { TelegramModule } from './telegram/telegram.module';
import { AuthModule } from './auth/auth.module';
import { ApiModule } from './api/api.module';

/**
 * AppModule — корневой модуль приложения
 *
 * Структура модулей:
 * - PrismaModule: работа с базой данных
 * - UserModule: управление пользователями
 * - SpaceModule: управление пространствами (группами)
 * - SectionsModule: разделы с вложенностью
 * - ItemsModule: контент разделов
 * - SearchModule: полнотекстовый поиск
 * - TelegramModule: интеграция с Telegram Bot API
 * - AuthModule: авторизация и права доступа
 * - ApiModule: REST API для Mini App
 */
@Module({
  imports: [
    PrismaModule,
    UserModule,
    SpaceModule,
    SectionsModule,
    ItemsModule,
    SearchModule,
    TelegramModule,
    AuthModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
