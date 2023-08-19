import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { helpCommand, meCommand } from "./routes";
import { rollCommand } from "./routes/roll";
import { Repo } from "./db";
import { enrichHandler } from "./middleware/dbMiddleware";
import { Ctx } from "./types";
import { ActionCtx, addPlayer, clearRoomHandle, createRoom, handleTeamWin, removePlayer, replayHandler, showPlayers, startGame } from "./routes/room";
import { getLeaderBoardTotal, getLeaderBoardWeekly } from "./routes/leaderBoard";

const COMMANDS: Record<string, (database: Repo, ctx: Ctx) => Promise<void> | void> = {
  'me': meCommand,
  'roll': rollCommand,
  'help': helpCommand,
  'add': addPlayer,
  'remove': removePlayer,
  'room': showPlayers,
  'create': createRoom,
  'start': startGame,
  'clear': clearRoomHandle,
  'leaders': getLeaderBoardTotal,
  'leadersWeekly': getLeaderBoardWeekly,
}

const ACTIONS: Record<string, (database: Repo, ctx: ActionCtx) => Promise<void> | void> = {
  'first team win': (database, ctx) => handleTeamWin(database, ctx, 'first'),
  'second team win': (database, ctx) => handleTeamWin(database, ctx, 'second'),
  'replay': (database, ctx) => replayHandler(database, ctx)
}

export const routing = (bot: Telegraf<Context<Update>>, database: Repo) => {
  Object
    .entries(COMMANDS)
    .forEach(([key, handler]) => {
      const handlerWithDB = enrichHandler(handler, database);
      bot.command(key, handlerWithDB);
    });

  Object
    .entries(ACTIONS)
    .forEach(([key, handler]) => {
      const handlerWithDB = enrichHandler(handler, database);
      bot.action(new RegExp(key), handlerWithDB);
    });
};