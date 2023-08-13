import { Telegraf } from 'telegraf';
import { routing } from './router';
import { initDB } from './db';
import { config } from 'dotenv';
config();

const bot = new Telegraf(process.env.BOT_TOKEN);

(async () => {
  const repo = await initDB();
  routing(bot, repo);
  bot.launch();
})()

// // Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));