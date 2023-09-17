import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { helpCommand, meCommand } from "./routes";
import { rollCommand } from "./routes/roll";
import { Repo } from "./db";
import { enrichHandler } from "./middleware/dbMiddleware";
import { Ctx } from "./types";
import {
  ActionCtx,
  addPlayer,
  cancelCommand,
  clearRoomHandle,
  createRoom,
  handleTeamWin,
  exitCommand,
  replayHandler,
  showPlayers,
  startCommand, startGame, removeCommand, removePlayerAction
} from "./routes/room";
import { getLeaderBoardTotal, getLeaderBoardWeekly } from "./routes/leaderBoard";

const COMMANDS: Record<string, (database: Repo, ctx: Ctx) => Promise<void> | void> = {
  'me': meCommand,
  'roll': rollCommand,
  'help': helpCommand,
  'add': addPlayer,
  'exit': exitCommand,
  'remove': removeCommand,
  'room': showPlayers,
  'create': createRoom,
  'start': startCommand,
  'clear': clearRoomHandle,
  'leaders': getLeaderBoardTotal,
  'leadersWeekly': getLeaderBoardWeekly,
  'cancel': cancelCommand,
}

const ACTIONS: Record<string, (database: Repo, ctx: ActionCtx) => Promise<void> | void> = {
  'first team win': (database, ctx) => handleTeamWin(database, ctx, 'first'),
  'second team win': (database, ctx) => handleTeamWin(database, ctx, 'second'),
  'replay': replayHandler,
  'start game': startGame,
  'remove player': removePlayerAction,
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
