import { Module } from '@nestjs/common';
import { SearchService } from './search.service';

/**
 * SearchModule — модуль полнотекстового поиска
 * Использует Prisma для поиска по разделам и контенту
 */
@Module({
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
