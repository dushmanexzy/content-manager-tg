import { z } from 'zod';
import { telegramClient } from '../telegram-client.js';

export const messageTools = {
  send_message: {
    description: 'Send a text message to a Telegram chat',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID or username (e.g., @channel)',
        },
        text: {
          type: 'string',
          description: 'Message text',
        },
        parse_mode: {
          type: 'string',
          enum: ['HTML', 'Markdown', 'MarkdownV2'],
          description: 'Text formatting mode',
        },
        disable_web_page_preview: {
          type: 'boolean',
          description: 'Disable link previews',
        },
        disable_notification: {
          type: 'boolean',
          description: 'Send silently',
        },
        reply_to_message_id: {
          type: 'number',
          description: 'Message ID to reply to',
        },
        buttons: {
          type: 'array',
          description: 'Inline keyboard buttons (array of rows, each row is array of buttons)',
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                url: { type: 'string' },
                callback_data: { type: 'string' },
              },
              required: ['text'],
            },
          },
        },
      },
      required: ['chat_id', 'text'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        text: z.string(),
        parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
        disable_web_page_preview: z.boolean().optional(),
        disable_notification: z.boolean().optional(),
        reply_to_message_id: z.number().optional(),
        buttons: z
          .array(
            z.array(
              z.object({
                text: z.string(),
                url: z.string().optional(),
                callback_data: z.string().optional(),
              })
            )
          )
          .optional(),
      });

      const input = schema.parse(args);
      const replyMarkup = input.buttons
        ? { inline_keyboard: input.buttons }
        : undefined;

      const result = await telegramClient.sendMessage(input.chat_id, input.text, {
        parse_mode: input.parse_mode,
        disable_web_page_preview: input.disable_web_page_preview,
        disable_notification: input.disable_notification,
        reply_to_message_id: input.reply_to_message_id,
        reply_markup: replyMarkup,
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

  edit_message: {
    description: 'Edit a text message',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID',
        },
        message_id: {
          type: 'number',
          description: 'Message ID to edit',
        },
        text: {
          type: 'string',
          description: 'New message text',
        },
        parse_mode: {
          type: 'string',
          enum: ['HTML', 'Markdown', 'MarkdownV2'],
          description: 'Text formatting mode',
        },
        buttons: {
          type: 'array',
          description: 'New inline keyboard buttons',
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                url: { type: 'string' },
                callback_data: { type: 'string' },
              },
              required: ['text'],
            },
          },
        },
      },
      required: ['chat_id', 'message_id', 'text'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        message_id: z.number(),
        text: z.string(),
        parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
        buttons: z
          .array(
            z.array(
              z.object({
                text: z.string(),
                url: z.string().optional(),
                callback_data: z.string().optional(),
              })
            )
          )
          .optional(),
      });

      const input = schema.parse(args);
      const replyMarkup = input.buttons
        ? { inline_keyboard: input.buttons }
        : undefined;

      const result = await telegramClient.editMessageText(
        input.chat_id,
        input.message_id,
        input.text,
        {
          parse_mode: input.parse_mode,
          reply_markup: replyMarkup,
        }
      );

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

  delete_message: {
    description: 'Delete a message',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID',
        },
        message_id: {
          type: 'number',
          description: 'Message ID to delete',
        },
      },
      required: ['chat_id', 'message_id'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        message_id: z.number(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.deleteMessage(input.chat_id, input.message_id);

      return {
        content: [
          {
            type: 'text' as const,
            text: result ? 'Message deleted successfully' : 'Failed to delete message',
          },
        ],
      };
    },
  },

  forward_message: {
    description: 'Forward a message from one chat to another',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Target chat ID',
        },
        from_chat_id: {
          type: 'string',
          description: 'Source chat ID',
        },
        message_id: {
          type: 'number',
          description: 'Message ID to forward',
        },
        disable_notification: {
          type: 'boolean',
          description: 'Send silently',
        },
      },
      required: ['chat_id', 'from_chat_id', 'message_id'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        from_chat_id: z.string(),
        message_id: z.number(),
        disable_notification: z.boolean().optional(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.forwardMessage(
        input.chat_id,
        input.from_chat_id,
        input.message_id,
        { disable_notification: input.disable_notification }
      );

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
