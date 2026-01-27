import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { SectionsModule } from '../sections/sections.module';
import { ItemsModule } from '../items/items.module';
import { SearchModule } from '../search/search.module';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * ApiModule — REST API для Mini App
 * Объединяет все модули и предоставляет endpoints
 */
@Module({
  imports: [
    AuthModule, // Для PermissionsGuard
    TelegramModule, // Для TelegramApiService (используется в PermissionsGuard)
    PrismaModule, // Для PrismaService
    SectionsModule,
    ItemsModule,
    SearchModule,
  ],
  controllers: [ApiController],
})
export class ApiModule {}
