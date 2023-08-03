import { Markup, Telegraf } from 'telegraf';
import { compose } from 'rambda';
import { routing } from './router';
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

routing(bot);
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));