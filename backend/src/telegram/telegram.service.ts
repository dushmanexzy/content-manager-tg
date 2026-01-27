import { Injectable, Logger } from '@nestjs/common';

export interface InlineKeyboardButton {
    text: string;
    callback_data?: string;
    url?: string;
    web_app?: { url: string };
}

export interface SendMessageOptions {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_markup?: {
        inline_keyboard?: InlineKeyboardButton[][];
        keyboard?: { text: string }[][];
        remove_keyboard?: boolean;
        one_time_keyboard?: boolean;
        resize_keyboard?: boolean;
    };
}

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly apiUrl = process.env.TELEGRAM_API_URL ?? 'https://api.telegram.org';
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';

    constructor() {
        if (!this.botToken) {
            this.logger.warn('TELEGRAM_BOT_TOKEN is not set in .env');
        }
    }

    private get baseUrl() {
        return `${this.apiUrl}/bot${this.botToken}`;
    }

    async sendMessage(chatId: number | string, text: string, options?: SendMessageOptions) {
        if (!this.botToken) {
            this.logger.error('Cannot sendMessage: TELEGRAM_BOT_TOKEN is empty');
            return;
        }

        const url = `${this.baseUrl}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                ...options,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            this.logger.error(`Telegram sendMessage error: ${response.status} - ${JSON.stringify(data)}`);
        }

        return data;
    }

    async answerCallbackQuery(callbackQueryId: string, text?: string) {
        if (!this.botToken) {
            this.logger.error('Cannot answerCallbackQuery: TELEGRAM_BOT_TOKEN is empty');
            return;
        }

        const url = `${this.baseUrl}/answerCallbackQuery`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            this.logger.error(`Telegram answerCallbackQuery error: ${response.status} - ${JSON.stringify(data)}`);
        }

        return data;
    }

    async editMessageText(chatId: number | string, messageId: number, text: string, options?: SendMessageOptions) {
        if (!this.botToken) {
            this.logger.error('Cannot editMessageText: TELEGRAM_BOT_TOKEN is empty');
            return;
        }

        const url = `${this.baseUrl}/editMessageText`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text,
                ...options,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            this.logger.error(`Telegram editMessageText error: ${response.status} - ${JSON.stringify(data)}`);
        }

        return data;
    }
}
