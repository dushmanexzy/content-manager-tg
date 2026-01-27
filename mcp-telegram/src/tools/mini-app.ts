import { z } from 'zod';
import { telegramClient } from '../telegram-client.js';

export const miniAppTools = {
  send_mini_app_button: {
    description: 'Send a message with a Mini App (Web App) button',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID',
        },
        text: {
          type: 'string',
          description: 'Message text',
        },
        button_text: {
          type: 'string',
          description: 'Text on the button',
        },
        web_app_url: {
          type: 'string',
          description: 'URL of the Mini App (must be HTTPS)',
        },
        parse_mode: {
          type: 'string',
          enum: ['HTML', 'Markdown', 'MarkdownV2'],
          description: 'Text formatting mode',
        },
      },
      required: ['chat_id', 'text', 'button_text', 'web_app_url'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        text: z.string(),
        button_text: z.string(),
        web_app_url: z.string().url(),
        parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
      });

      const input = schema.parse(args);

      const result = await telegramClient.sendMessage(input.chat_id, input.text, {
        parse_mode: input.parse_mode,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: input.button_text,
                web_app: { url: input.web_app_url },
              },
            ],
          ],
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
};
