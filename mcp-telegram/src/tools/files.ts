import { z } from 'zod';
import { telegramClient } from '../telegram-client.js';

export const fileTools = {
  send_photo: {
    description: 'Send a photo to a chat (by URL or file_id)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID',
        },
        photo: {
          type: 'string',
          description: 'Photo URL or file_id from a previous message',
        },
        caption: {
          type: 'string',
          description: 'Photo caption',
        },
        parse_mode: {
          type: 'string',
          enum: ['HTML', 'Markdown', 'MarkdownV2'],
          description: 'Caption formatting mode',
        },
        disable_notification: {
          type: 'boolean',
          description: 'Send silently',
        },
        reply_to_message_id: {
          type: 'number',
          description: 'Message ID to reply to',
        },
      },
      required: ['chat_id', 'photo'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        photo: z.string(),
        caption: z.string().optional(),
        parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
        disable_notification: z.boolean().optional(),
        reply_to_message_id: z.number().optional(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.sendPhoto(input.chat_id, input.photo, {
        caption: input.caption,
        parse_mode: input.parse_mode,
        disable_notification: input.disable_notification,
        reply_to_message_id: input.reply_to_message_id,
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

  send_document: {
    description: 'Send a document to a chat (by URL or file_id)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID',
        },
        document: {
          type: 'string',
          description: 'Document URL or file_id',
        },
        caption: {
          type: 'string',
          description: 'Document caption',
        },
        parse_mode: {
          type: 'string',
          enum: ['HTML', 'Markdown', 'MarkdownV2'],
          description: 'Caption formatting mode',
        },
        disable_notification: {
          type: 'boolean',
          description: 'Send silently',
        },
        reply_to_message_id: {
          type: 'number',
          description: 'Message ID to reply to',
        },
      },
      required: ['chat_id', 'document'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        document: z.string(),
        caption: z.string().optional(),
        parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
        disable_notification: z.boolean().optional(),
        reply_to_message_id: z.number().optional(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.sendDocument(input.chat_id, input.document, {
        caption: input.caption,
        parse_mode: input.parse_mode,
        disable_notification: input.disable_notification,
        reply_to_message_id: input.reply_to_message_id,
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

  get_file: {
    description: 'Get file info and download URL by file_id',
    inputSchema: {
      type: 'object' as const,
      properties: {
        file_id: {
          type: 'string',
          description: 'File ID from a message',
        },
      },
      required: ['file_id'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        file_id: z.string(),
      });

      const input = schema.parse(args);
      const file = await telegramClient.getFile(input.file_id);

      const result = {
        ...file,
        download_url: file.file_path ? telegramClient.getFileUrl(file.file_path) : null,
      };

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
