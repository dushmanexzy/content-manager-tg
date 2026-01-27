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
      // Проверяем, есть ли новые участники
      if (message.new_chat_members && message.new_chat_members.length > 0) {
        await this.handleNewChatMembers(message.chat, message.new_chat_members);
      } else {
        await this.handleMessage(message);
      }
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
      const botUsername = process.env.TELEGRAM_BOT_USERNAME;
      const appLink = botUsername
        ? `https://t.me/${botUsername}/app?startapp=${chatId}`
        : null;

      const keyboard = appLink
        ? {
            inline_keyboard: [
              [{ text: '📱 Открыть приложение', url: appLink }],
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
   * Приветствие новых участников группы
   */
  private async handleNewChatMembers(chat: any, newMembers: any[]) {
    // Игнорируем ботов
    const humans = newMembers.filter((m) => !m.is_bot);
    if (humans.length === 0) return;

    // Работаем только с группами
    if (chat.type !== 'group' && chat.type !== 'supergroup') return;

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    if (!botUsername) return;

    const names = humans.map((m) => m.first_name).join(', ');
    const appLink = `https://t.me/${botUsername}/app?startapp=${chat.id}`;

    const welcomeText = `Привет, ${names}! 👋

📚 <b>Content Manager</b> — приложение для организации информации в группе.

<b>Что можно делать:</b>
• Создавать разделы и подразделы
• Добавлять текст, ссылки, изображения, файлы
• Искать по всему контенту
• Редактировать и удалять записи

Нажмите кнопку ниже, чтобы открыть приложение:`;

    const keyboard = {
      inline_keyboard: [[{ text: '📱 Открыть приложение', url: appLink }]],
    };

    await this.telegramService.sendMessage(chat.id, welcomeText, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
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
    const helpText = `📚 <b>Content Manager — справка</b>

<b>Что можно делать:</b>
• Создавать разделы и подразделы (неограниченная вложенность)
• Добавлять контент: текст, ссылки, изображения, файлы
• Искать по всему содержимому
• Редактировать и удалять записи

<b>Права доступа:</b>
• Администраторы группы — полный доступ
• Участники — только просмотр

<b>Команды:</b>
/start — открыть приложение
/help — показать эту справку

При добавлении контента уведомление со ссылкой отправляется в группу.`;

    await this.telegramService.sendMessage(chatId, helpText, {
      parse_mode: 'HTML',
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
