import { z } from 'zod';
import { telegramClient } from '../telegram-client.js';

export const chatTools = {
  get_chat: {
    description: 'Get information about a chat',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID or username (e.g., @channel)',
        },
      },
      required: ['chat_id'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.getChat(input.chat_id);

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

  get_chat_member: {
    description: 'Get information about a member of a chat',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID or username',
        },
        user_id: {
          type: 'number',
          description: 'User ID',
        },
      },
      required: ['chat_id', 'user_id'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        user_id: z.number(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.getChatMember(input.chat_id, input.user_id);

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

  get_chat_administrators: {
    description: 'Get list of administrators in a chat',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID or username',
        },
      },
      required: ['chat_id'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.getChatAdministrators(input.chat_id);

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

  ban_chat_member: {
    description: 'Ban a user from a chat',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID',
        },
        user_id: {
          type: 'number',
          description: 'User ID to ban',
        },
        until_date: {
          type: 'number',
          description: 'Unix timestamp when ban expires (0 = permanent)',
        },
        revoke_messages: {
          type: 'boolean',
          description: 'Delete all messages from the user',
        },
      },
      required: ['chat_id', 'user_id'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        user_id: z.number(),
        until_date: z.number().optional(),
        revoke_messages: z.boolean().optional(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.banChatMember(input.chat_id, input.user_id, {
        until_date: input.until_date,
        revoke_messages: input.revoke_messages,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: result ? 'User banned successfully' : 'Failed to ban user',
          },
        ],
      };
    },
  },

  unban_chat_member: {
    description: 'Unban a user from a chat',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chat_id: {
          type: 'string',
          description: 'Chat ID',
        },
        user_id: {
          type: 'number',
          description: 'User ID to unban',
        },
        only_if_banned: {
          type: 'boolean',
          description: 'Only unban if user is currently banned',
        },
      },
      required: ['chat_id', 'user_id'],
    },
    handler: async (args: Record<string, unknown>) => {
      const schema = z.object({
        chat_id: z.string(),
        user_id: z.number(),
        only_if_banned: z.boolean().optional(),
      });

      const input = schema.parse(args);
      const result = await telegramClient.unbanChatMember(
        input.chat_id,
        input.user_id,
        input.only_if_banned
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: result ? 'User unbanned successfully' : 'Failed to unban user',
          },
        ],
      };
    },
  },
};
