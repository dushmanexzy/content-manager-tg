import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramApiService } from './telegram-api.service';
import { TelegramController } from './telegram.controller';
import { UserModule } from '../user/user.module';
import { SpaceModule } from '../space/space.module';

/**
 * TelegramModule — интеграция с Telegram Bot API
 * - TelegramApiService: низкоуровневые API вызовы (getChatMember, getChat)
 * - TelegramService: высокоуровневые операции (отправка сообщений)
 * - TelegramController: обработка webhook-апдейтов
 */
@Module({
  imports: [UserModule, SpaceModule],
  controllers: [TelegramController],
  providers: [TelegramService, TelegramApiService],
  exports: [TelegramService, TelegramApiService],
})
export class TelegramModule {}
