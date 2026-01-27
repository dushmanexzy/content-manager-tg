import { Body, Controller, Logger, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UserService } from '../user/user.service';
import { SpaceService } from '../space/space.service';

/**
 * TelegramController — обработка webhook-апдейтов от Telegram
 * Поддерживает работу в группах (supergroup, group)
 */
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly userService: UserService,
    private readonly spaceService: SpaceService,
  ) {}

  @Post('webhook')
  async handleUpdate(@Body() update: any) {
    this.logger.debug(`Telegram update: ${JSON.stringify(update)}`);

    // Обработка my_chat_member — бот добавлен/удалён из группы
    if (update.my_chat_member) {
      await this.handleMyChatMember(update.my_chat_member);
      return { ok: true };
    }

    // Обработка callback_query (нажатия на inline-кнопки)
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return { ok: true };
    }

    // Обработка сообщений
    const message = update?.message;
    if (message && message.chat && message.from) {
      await this.handleMessage(message);
    }

    return { ok: true };
  }

  /**
   * Обработка события my_chat_member — изменение статуса бота в чате
   * Используется для создания/удаления Space при добавлении/удалении бота
   */
  private async handleMyChatMember(chatMember: any) {
    const chat = chatMember.chat;
    const newStatus = chatMember.new_chat_member?.status;
    const oldStatus = chatMember.old_chat_member?.status;

    // Работаем только с группами
    if (chat.type !== 'group' && chat.type !== 'supergroup') {
      return;
    }

    const chatId = String(chat.id);
    const chatTitle = chat.title || 'Группа';

    this.logger.log(`Bot status in chat ${chatId}: ${oldStatus} -> ${newStatus}`);

    // Бот добавлен в группу (стал member или administrator)
    if (
      (newStatus === 'member' || newStatus === 'administrator') &&
      (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus)
    ) {
      // Создаём Space для группы
      await this.spaceService.findOrCreate(chatId, chatTitle);
      this.logger.log(`Space created for chat ${chatId} (${chatTitle})`);

      // Отправляем приветственное сообщение
      const webAppUrl = process.env.MINI_APP_URL;
      const keyboard = webAppUrl
        ? {
            inline_keyboard: [
              [{ text: '📱 Открыть приложение', web_app: { url: webAppUrl } }],
            ],
          }
        : undefined;

      await this.telegramService.sendMessage(
        chat.id,
        `Привет! 👋\n\nЯ помогу организовать информацию в этой группе.\n\nИспользуйте кнопку ниже или команду /start чтобы открыть приложение.`,
        { reply_markup: keyboard },
      );
    }

    // Бот удалён из группы
    if (newStatus === 'left' || newStatus === 'kicked') {
      // Удаляем Space и все данные группы
      await this.spaceService.deleteByChatId(chatId);
      this.logger.log(`Space deleted for chat ${chatId}`);
    }
  }

  /**
   * Обработка сообщений
   */
  private async handleMessage(message: any) {
    const from = message.from;
    const chat = message.chat;
    const text = message.text?.trim() || '';

    // Сохраняем/обновляем пользователя в БД
    await this.userService.findOrCreateByTelegram({
      telegramId: String(from.id),
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
    });

    // Обработка команд в группах
    if (
      (chat.type === 'group' || chat.type === 'supergroup') &&
      text.startsWith('/')
    ) {
      const command = text.split(' ')[0].split('@')[0].toLowerCase(); // Убираем @botname

      switch (command) {
        case '/start':
          await this.handleGroupStartCommand(chat);
          break;
        case '/help':
          await this.handleGroupHelpCommand(chat.id);
          break;
      }
      return;
    }

    // В личных чатах — направляем в группу
    if (chat.type === 'private') {
      await this.telegramService.sendMessage(
        chat.id,
        'Этот бот работает в группах.\n\nДобавьте меня в группу, чтобы начать использовать.',
      );
    }
  }

  /**
   * Команда /start в группе — показать кнопку Mini App
   */
  private async handleGroupStartCommand(chat: any) {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME;

    if (!botUsername) {
      await this.telegramService.sendMessage(
        chat.id,
        'Mini App не настроен. Обратитесь к администратору.',
      );
      return;
    }

    // Формируем ссылку на Mini App с chat_id в startapp параметре
    const appLink = `https://t.me/${botUsername}/app?startapp=${chat.id}`;

    const keyboard = {
      inline_keyboard: [[{ text: '📱 Открыть приложение', url: appLink }]],
    };

    await this.telegramService.sendMessage(
      chat.id,
      '📚 Нажмите кнопку ниже, чтобы открыть приложение:',
      { reply_markup: keyboard },
    );
  }

  /**
   * Команда /help в группе
   */
  private async handleGroupHelpCommand(chatId: number) {
    const helpText = `📖 *Как использовать бота:*

1. Нажмите кнопку "Открыть приложение" или используйте /start
2. В приложении создавайте разделы и добавляйте контент
3. Все участники группы видят общий контент

*Команды:*
/start - Открыть приложение
/help - Показать справку`;

    await this.telegramService.sendMessage(chatId, helpText, {
      parse_mode: 'Markdown',
    });
  }

  /**
   * Обработка callback_query
   */
  private async handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message?.chat?.id;
    const data = callbackQuery.data;

    this.logger.log(`Callback query: ${data}`);

    // Подтверждаем получение callback
    await this.telegramService.answerCallbackQuery(callbackQuery.id);

    if (!chatId) return;

    // Можно добавить обработку других callback
  }
}
