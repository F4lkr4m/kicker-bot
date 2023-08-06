import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { helpCommand, meCommand } from "./routes";
import { testCommand } from "./routes/test";
import { rollCommand } from "./routes/roll";
import { addPlayer, clearRoomHandle, createRoom, handleTeamWin, showPlayers, startGame } from "./routes/room";

export const routing = (bot: Telegraf<Context<Update>>) => {
  bot.command('create', createRoom);
  bot.command('add', addPlayer)
  bot.command('room', showPlayers);
  bot.command('start', startGame);
  bot.command('me', meCommand);
  bot.command('roll', rollCommand);
  bot.command('help', helpCommand);
  bot.command('test', testCommand);
  bot.command('clear', clearRoomHandle);

  bot.action('first team win', (ctx) => handleTeamWin(ctx, 'first'));
  bot.action('second team win', (ctx) => handleTeamWin(ctx, 'second'));
};