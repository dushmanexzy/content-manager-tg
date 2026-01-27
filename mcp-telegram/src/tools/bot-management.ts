import { z } from 'zod';
import { telegramClient } from '../telegram-client.js';

export const botManagementTools = {
  get_me: {
    description: 'Get information about the bot',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await telegramClient.getMe();
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

  set_webhook: {
    description: 'Set webhook URL for receiving updates',
    inputSchema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'HTTPS URL for webhook',
        },
        max_connections: {
          type: 'number',
          description: 'Maximum allowed connections (1-100)',
        },
        allowed_updates: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of update types to receive (e.g., message, callback_query)',
        },
        drop_pending_updates: {
          type: 'boolean',
          description: 'Drop pending updates before setting webhook',
        },
        secret_token: {
          type: 'string',
          description: 'Secret token for X-Telegram-Bot-Api-Secret-Token header',
        },
      },
      required: ['url'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        url: z.string().url(),
        max_connections: z.number().min(1).max(100).optional(),
        allowed_updates: z.array(z.string()).optional(),
        drop_pending_updates: z.boolean().optional(),
        secret_token: z.string().optional(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.setWebhook(input.url, {
        max_connections: input.max_connections,
        allowed_updates: input.allowed_updates,
        drop_pending_updates: input.drop_pending_updates,
        secret_token: input.secret_token,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: result ? 'Webhook set successfully' : 'Failed to set webhook',
          },
        ],
      };
    },
  },

  delete_webhook: {
    description: 'Delete webhook and switch to getUpdates',
    inputSchema: {
      type: 'object' as const,
      properties: {
        drop_pending_updates: {
          type: 'boolean',
          description: 'Drop pending updates',
        },
      },
      required: [],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        drop_pending_updates: z.boolean().optional(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.deleteWebhook(input.drop_pending_updates);

      return {
        content: [
          {
            type: 'text' as const,
            text: result ? 'Webhook deleted successfully' : 'Failed to delete webhook',
          },
        ],
      };
    },
  },

  get_webhook_info: {
    description: 'Get current webhook status',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
    handler: async () => {
      const result = await telegramClient.getWebhookInfo();
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
