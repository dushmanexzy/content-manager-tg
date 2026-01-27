import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard, AuthenticatedRequest } from '../auth/permissions.guard';
import { SectionsService, CreateSectionDto, UpdateSectionDto } from '../sections/sections.service';
import { ItemsService, CreateItemDto, UpdateItemDto } from '../items/items.service';
import { SearchService } from '../search/search.service';
import { TelegramApiService } from '../telegram/telegram-api.service';
import { TelegramService } from '../telegram/telegram.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ApiController — основной API для Mini App
 * Все endpoints защищены JWT + проверкой прав в группе
 */
@Controller('api')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApiController {
  constructor(
    private readonly sectionsService: SectionsService,
    private readonly itemsService: ItemsService,
    private readonly searchService: SearchService,
    private readonly telegramApi: TelegramApiService,
    private readonly telegramService: TelegramService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Отправить уведомление в группу о созданном контенте
   */
  private async notifyGroup(
    spaceId: number,
    message: string,
    sectionId?: number,
  ) {
    try {
      const space = await this.prisma.space.findUnique({
        where: { id: spaceId },
        select: { chatId: true },
      });

      if (!space?.chatId) return;

      const botUsername = process.env.TELEGRAM_BOT_USERNAME;
      let keyboard;

      if (botUsername) {
        // Формат: chatId_section_sectionId или просто chatId
        const startapp = sectionId
          ? `${space.chatId}_section_${sectionId}`
          : space.chatId;
        const deepLink = `https://t.me/${botUsername}/app?startapp=${startapp}`;
        keyboard = {
          inline_keyboard: [[{ text: '📂 Открыть', url: deepLink }]],
        };
      }

      await this.telegramService.sendMessage(space.chatId, message, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    } catch (error) {
      // Не блокируем основной запрос при ошибке уведомления
      console.error('Failed to send notification:', error);
    }
  }

  // ============ User Info ============

  /**
   * GET /api/me — Информация о текущем пользователе и его правах
   */
  @Get('me')
  async getMe(@Request() req: AuthenticatedRequest) {
    return {
      user: req.user,
      permissions: req.permissions,
    };
  }

  // ============ Sections ============

  /**
   * GET /api/sections — Корневые разделы текущего пространства
   */
  @Get('sections')
  async getRootSections(@Request() req: AuthenticatedRequest) {
    return this.sectionsService.getRootSections(req.user.spaceId);
  }

  /**
   * GET /api/sections/:id — Раздел с его содержимым
   */
  @Get('sections/:id')
  async getSection(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Проверяем принадлежность к пространству
    const belongsToSpace = await this.sectionsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Section not found');
    }

    const section = await this.sectionsService.getById(id);
    const path = await this.sectionsService.getPath(id);

    return { ...section, path };
  }

  /**
   * GET /api/sections/:id/children — Дочерние разделы
   */
  @Get('sections/:id/children')
  async getSectionChildren(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const belongsToSpace = await this.sectionsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Section not found');
    }

    return this.sectionsService.getChildren(id);
  }

  /**
   * POST /api/sections — Создать раздел
   */
  @Post('sections')
  async createSection(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateSectionDto,
  ) {
    // Проверяем право на запись
    if (!req.permissions.canWrite) {
      throw new ForbiddenException('You cannot create sections');
    }

    // Если есть parentId, проверяем его принадлежность
    if (dto.parentId) {
      const belongsToSpace = await this.sectionsService.belongsToSpace(dto.parentId, req.user.spaceId);
      if (!belongsToSpace) {
        throw new NotFoundException('Parent section not found');
      }
    }

    const section = await this.sectionsService.create(req.user.spaceId, dto, req.user.id);

    // Уведомление в группу
    const userName = req.user.firstName || req.user.username || 'Пользователь';
    const path = await this.sectionsService.getPath(section.id);
    const pathStr = path.map(p => p.title).join(' → ');
    await this.notifyGroup(
      req.user.spaceId,
      `📁 <b>${userName}</b> создал раздел:\n${pathStr}`,
      section.id,
    );

    return section;
  }

  /**
   * PATCH /api/sections/:id — Обновить раздел
   */
  @Patch('sections/:id')
  async updateSection(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionDto,
  ) {
    const belongsToSpace = await this.sectionsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Section not found');
    }

    // Проверяем права: автор или админ
    const isOwner = await this.sectionsService.isCreatedBy(id, req.user.id);
    if (!isOwner && !req.permissions.canManage) {
      throw new ForbiddenException('You cannot edit this section');
    }

    return this.sectionsService.update(id, dto);
  }

  /**
   * DELETE /api/sections/:id — Удалить раздел
   */
  @Delete('sections/:id')
  async deleteSection(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const belongsToSpace = await this.sectionsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Section not found');
    }

    // Проверяем права: автор может удалить своё, админ — любое
    const isOwner = await this.sectionsService.isCreatedBy(id, req.user.id);
    if (isOwner && !req.permissions.canDeleteOwn) {
      throw new ForbiddenException('You cannot delete sections');
    }
    if (!isOwner && !req.permissions.canDeleteOthers) {
      throw new ForbiddenException('You cannot delete this section');
    }

    return this.sectionsService.delete(id);
  }

  /**
   * POST /api/sections/:id/move — Переместить раздел
   */
  @Post('sections/:id/move')
  async moveSection(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { parentId: number | null },
  ) {
    if (!req.permissions.canManage) {
      throw new ForbiddenException('Only admins can move sections');
    }

    const belongsToSpace = await this.sectionsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Section not found');
    }

    // Проверяем новый родительский раздел
    if (body.parentId !== null) {
      const parentBelongs = await this.sectionsService.belongsToSpace(body.parentId, req.user.spaceId);
      if (!parentBelongs) {
        throw new NotFoundException('Target parent section not found');
      }
    }

    return this.sectionsService.move(id, body.parentId);
  }

  // ============ Items ============

  /**
   * GET /api/items/:id — Получить элемент
   */
  @Get('items/:id')
  async getItem(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const belongsToSpace = await this.itemsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Item not found');
    }

    return this.itemsService.getById(id);
  }

  /**
   * POST /api/sections/:sectionId/items — Создать элемент в разделе
   */
  @Post('sections/:sectionId/items')
  async createItem(
    @Request() req: AuthenticatedRequest,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() dto: CreateItemDto,
  ) {
    if (!req.permissions.canWrite) {
      throw new ForbiddenException('You cannot create items');
    }

    const belongsToSpace = await this.sectionsService.belongsToSpace(sectionId, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Section not found');
    }

    const item = await this.itemsService.create(sectionId, dto, req.user.id);

    // Уведомление в группу (только для text и link)
    if (dto.type === 'text' || dto.type === 'link') {
      const userName = req.user.firstName || req.user.username || 'Пользователь';
      const path = await this.sectionsService.getPath(sectionId);
      const pathStr = path.map(p => p.title).join(' → ');
      const typeIcon = dto.type === 'text' ? '📝' : '🔗';
      const itemTitle = dto.title || (dto.type === 'link' ? dto.content : 'Заметка');
      await this.notifyGroup(
        req.user.spaceId,
        `${typeIcon} <b>${userName}</b> добавил ${dto.type === 'text' ? 'заметку' : 'ссылку'}:\n<b>${itemTitle}</b>\n📁 ${pathStr}`,
        sectionId,
      );
    }

    return item;
  }

  /**
   * POST /api/sections/:sectionId/items/upload — Загрузить файл и создать элемент
   * Файл отправляется в Telegram группу, file_id сохраняется в БД
   */
  @Post('sections/:sectionId/items/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } })) // 50MB limit
  async uploadItem(
    @Request() req: AuthenticatedRequest,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string },
  ) {
    if (!req.permissions.canWrite) {
      throw new ForbiddenException('You cannot create items');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const belongsToSpace = await this.sectionsService.belongsToSpace(sectionId, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Section not found');
    }

    // Получаем chatId группы
    const space = await this.prisma.space.findUnique({
      where: { id: req.user.spaceId },
      select: { chatId: true },
    });

    if (!space?.chatId) {
      throw new BadRequestException('Space chat not found');
    }

    // Определяем тип файла
    const isImage = file.mimetype.startsWith('image/');
    const type = isImage ? 'image' : 'file';

    // Получаем путь к разделу для caption
    const path = await this.sectionsService.getPath(sectionId);
    const pathStr = path.map(p => p.title).join(' → ');
    const caption = body.title
      ? `📎 ${body.title}\n📁 ${pathStr}`
      : `📁 ${pathStr}`;

    // Deep link на раздел
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'your_bot';
    const deepLink = `https://t.me/${botUsername}/app?startapp=${space.chatId}_section_${sectionId}`;
    const replyMarkup = {
      inline_keyboard: [[
        { text: '📂 Открыть в приложении', url: deepLink }
      ]]
    };

    let fileId: string;
    let fileSize: number | undefined;

    // Отправляем файл в группу
    if (isImage) {
      const result = await this.telegramApi.sendPhoto(space.chatId, file.buffer, {
        caption,
        filename: file.originalname,
        reply_markup: replyMarkup,
      });

      if (!result) {
        throw new BadRequestException('Failed to upload image to Telegram');
      }

      // Берём file_id самого большого размера (последний в массиве)
      fileId = result.photo[result.photo.length - 1].file_id;
      fileSize = result.photo[result.photo.length - 1].file_size;
    } else {
      const result = await this.telegramApi.sendDocument(space.chatId, file.buffer, {
        caption,
        filename: file.originalname,
        reply_markup: replyMarkup,
      });

      if (!result) {
        throw new BadRequestException('Failed to upload file to Telegram');
      }

      fileId = result.document.file_id;
      fileSize = result.document.file_size;
    }

    // Создаём Item с file_id
    return this.itemsService.create(sectionId, {
      type,
      title: body.title || null,
      fileId,
      fileName: file.originalname,
      fileSize: fileSize || file.size,
      mimeType: file.mimetype,
    }, req.user.id);
  }

  /**
   * GET /api/files/:fileId — Получить URL для скачивания файла
   */
  @Get('files/:fileId')
  async getFileUrl(
    @Request() req: AuthenticatedRequest,
    @Param('fileId') fileId: string,
  ) {
    const fileInfo = await this.telegramApi.getFile(fileId);

    if (!fileInfo?.file_path) {
      throw new NotFoundException('File not found');
    }

    return {
      url: this.telegramApi.getFileUrl(fileInfo.file_path),
    };
  }

  /**
   * PATCH /api/items/:id — Обновить элемент
   */
  @Patch('items/:id')
  async updateItem(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    const belongsToSpace = await this.itemsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Item not found');
    }

    // Проверяем права: автор или админ
    const isOwner = await this.itemsService.isCreatedBy(id, req.user.id);
    if (!isOwner && !req.permissions.canManage) {
      throw new ForbiddenException('You cannot edit this item');
    }

    return this.itemsService.update(id, dto);
  }

  /**
   * DELETE /api/items/:id — Удалить элемент
   */
  @Delete('items/:id')
  async deleteItem(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const belongsToSpace = await this.itemsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Item not found');
    }

    const isOwner = await this.itemsService.isCreatedBy(id, req.user.id);
    if (isOwner && !req.permissions.canDeleteOwn) {
      throw new ForbiddenException('You cannot delete items');
    }
    if (!isOwner && !req.permissions.canDeleteOthers) {
      throw new ForbiddenException('You cannot delete this item');
    }

    return this.itemsService.delete(id);
  }

  /**
   * POST /api/items/:id/move — Переместить элемент в другой раздел
   */
  @Post('items/:id/move')
  async moveItem(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { sectionId: number },
  ) {
    if (!req.permissions.canManage) {
      throw new ForbiddenException('Only admins can move items');
    }

    const belongsToSpace = await this.itemsService.belongsToSpace(id, req.user.spaceId);
    if (!belongsToSpace) {
      throw new NotFoundException('Item not found');
    }

    const targetBelongs = await this.sectionsService.belongsToSpace(body.sectionId, req.user.spaceId);
    if (!targetBelongs) {
      throw new NotFoundException('Target section not found');
    }

    return this.itemsService.move(id, body.sectionId);
  }

  // ============ Search ============

  /**
   * GET /api/search?q=query — Поиск по пространству
   */
  @Get('search')
  async search(
    @Request() req: AuthenticatedRequest,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.searchService.search(req.user.spaceId, query || '', parsedLimit);
  }

  /**
   * GET /api/search/quick?q=query — Быстрый поиск для автодополнения
   */
  @Get('search/quick')
  async quickSearch(
    @Request() req: AuthenticatedRequest,
    @Query('q') query: string,
  ) {
    return this.searchService.quickSearch(req.user.spaceId, query || '', 10);
  }
}
