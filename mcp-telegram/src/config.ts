import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from backend directory
config({ path: resolve(__dirname, '../../backend/.env') });

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || 'https://api.telegram.org';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Warning: TELEGRAM_BOT_TOKEN is not set');
}
