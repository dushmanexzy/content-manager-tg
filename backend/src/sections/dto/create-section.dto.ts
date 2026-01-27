import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

/**
 * DTO для создания раздела
 * spaceId берётся из JWT токена, здесь только данные от клиента
 */
export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @IsOptional()
  parentId?: number | null; // null = корневой раздел
}

/**
 * DTO для обновления раздела
 */
export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsInt()
  @IsOptional()
  parentId?: number | null; // Перемещение в другой раздел
}
