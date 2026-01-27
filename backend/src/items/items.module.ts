import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';

/**
 * ItemsModule — модуль для управления контентом разделов
 * Экспортирует ItemsService для использования в других модулях
 */
@Module({
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
