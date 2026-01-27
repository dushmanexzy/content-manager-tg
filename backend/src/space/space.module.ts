import { Module } from '@nestjs/common';
import { SpaceService } from './space.service';

/**
 * SpaceModule — управление пространствами (группами Telegram)
 * Экспортирует SpaceService для использования в других модулях
 */
@Module({
  providers: [SpaceService],
  exports: [SpaceService],
})
export class SpaceModule {}
