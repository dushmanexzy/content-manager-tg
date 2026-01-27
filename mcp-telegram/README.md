# MCP Telegram Server

MCP server for interacting with Telegram Bot API from Claude Code.

## Installation

```bash
cd D:\tg-app\mcp-telegram
npm install
npm run build
```

## Configuration

The server loads environment variables from `../backend/.env`:

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_API_URL` - Telegram API URL (default: https://api.telegram.org)

## Add to Claude Code

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "telegram": {
      "command": "node",
      "args": ["D:/tg-app/mcp-telegram/dist/index.js"]
    }
  }
}
```

Then restart Claude Code and approve the MCP server when prompted.

## Available Tools

### Messages
- `send_message` - Send text message with formatting and buttons
- `edit_message` - Edit message text
- `delete_message` - Delete a message
- `forward_message` - Forward message to another chat

### Bot Management
- `get_me` - Get bot information
- `set_webhook` - Set webhook URL
- `delete_webhook` - Delete webhook
- `get_webhook_info` - Get webhook status

### Chat Operations
- `get_chat` - Get chat information
- `get_chat_member` - Get member info
- `get_chat_administrators` - List admins
- `ban_chat_member` - Ban user
- `unban_chat_member` - Unban user

### Mini App
- `send_mini_app_button` - Send message with Web App button

### Files
- `send_photo` - Send photo (URL or file_id)
- `send_document` - Send document (URL or file_id)
- `get_file` - Get file download URL

## Usage Examples

Send a message:
```
Use send_message with chat_id="123456789" and text="Hello!"
```

Send with inline buttons:
```
Use send_message with buttons=[[{"text": "Visit", "url": "https://example.com"}]]
```

Send Mini App button:
```
Use send_mini_app_button with web_app_url="https://your-app.com"
```
