import { compose } from "rambda";
import { Repo } from "../../db";
import { ROOM_REPO_ERRORS } from "../../db/Room";
import { Couple, Room } from "../../db/Room/types";
import { authGuardMiddleware } from "../../middleware";
import { Ctx } from "../../types";
import { getMentionOfUser } from "../../utils/getMentionOfUser";
import { selectPlayer } from "../roll";
import { Context, NarrowedContext } from "telegraf";
import { CallbackQuery, Update } from "telegraf/typings/core/types/typegram";
import { Game } from "../../db/Games/types";
import { URLSearchParams } from "url";
import { USER_REPO_ERRORS } from "../../db/Users";
import { User } from "../../db/Users/types";

export const createRoom = async (database: Repo, ctx: Ctx) => {
  const chatId = ctx.chat.id;
  try {
    const newRoom: Room = {
      id: chatId,
      players: [],
      state: 'IDLE',
      first: [],
      second: [],
    }
    await database.roomRepo.addRoom(newRoom);
    ctx.reply('Комната создана')
  } catch (error) {
    if (error.message === ROOM_REPO_ERRORS.ROOM_ALREADY_EXISTS) {
      ctx.reply('Комната уже создана');
      return;
    }
    ctx.reply('Произошла ошибка');
  }
};

export const clearRoomHandle = async (database: Repo, ctx: Ctx) => {
  const chatId = ctx.chat.id;
  const room = await database.roomRepo.getRoom(chatId);
  if (room.state === 'PLAYING') {
    ctx.reply('Нельзя очистить комнату, которая находится в процессе игры');
    return;
  }

  try {
    await database.roomRepo.setPlayersToRoom(chatId, []);
  } catch (error) {
    ctx.reply('Произошла ошибка');
  }
};

export const removePlayer = authGuardMiddleware(async (database: Repo, ctx: Ctx) => {
  const id = ctx.chat.id;
  const playerId = ctx.message.from.id;

  try {
    await database.roomRepo.removePlayerFromRoom(id, playerId);
    ctx.reply('Вы вышли из комнаты');
  } catch (error) {
    ctx.reply('Произошла ошибка');
  }
});

export const addPlayer = authGuardMiddleware(async (database: Repo, ctx: Ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.message.from.id;
  const message = ctx.message.text;

  const [, ...text] = message.split(' ');

  let addingOtherUsersText = '';
  if (text.length) {
    const usersToAdd: User[] = [];
    for (const elem of text) {
      if (elem.startsWith('@')) {
        const username = elem.slice(1);
        try {
          const userToAdd = await database.userRepo.getUserByUsername(username);
          usersToAdd.push(userToAdd);
        } catch (error) {
          if (error.message === USER_REPO_ERRORS.USER_NOT_EXISTS) {
            addingOtherUsersText += `Пользователь с ником ${username} не был найден\n`;
          }
        }
      }
    }

    for (const addingUser of usersToAdd) {
      try {
        await database.roomRepo.addPlayerToRoom(chatId, addingUser.id);
        addingOtherUsersText += `Пользователь с ником ${addingUser.username} добавлен в комнату\n`;
      } catch (error) {
        if (error.message === ROOM_REPO_ERRORS.USER_ALREADY_AT_ROOM) {
          addingOtherUsersText += `Пользователь с ником ${addingUser.username} уже состоит в комнате\n`;
        } else {
          addingOtherUsersText += `Пользователь с ником ${addingUser.username} по неизвестной причине не был добавлен в комнату\n`;
        }
      }
    }
  }

  try {
    await database.roomRepo.addPlayerToRoom(chatId, userId);
    ctx.reply(`Вы были успешно добавлены в комнату\n${addingOtherUsersText}`);
  } catch (error) {
    if (error.message === ROOM_REPO_ERRORS.USER_ALREADY_AT_ROOM) {
      ctx.reply(`Вы уже состоите в комнате\n${addingOtherUsersText}`);
      return;
    }
    ctx.reply(`Произошла ошибка, вы не были добавлены в комнату\n${addingOtherUsersText}`);
  }
});

export const showPlayers = async (database: Repo, ctx: Ctx) => {
  const chatId = ctx.chat.id;
  try {
    const room = await database.roomRepo.getRoom(chatId);
    let acc = '';
    for (const playerId of room.players) {
      const player = await database.userRepo.getUser(playerId);
      acc = `${acc} ${getMentionOfUser(player.id, player.name)}`;
    }
    ctx.replyWithHTML(`Список игроков в комнате: ${acc}`);
  } catch (error) {
    if (error.message === ROOM_REPO_ERRORS.ROOM_NOT_EXISTS) {
      ctx.reply('Комнаты не существует');
      return;
    }
    ctx.reply('Произошла ошибка');
  }
};

const MIN_PLAYER_FOR_START = 4;

export const startGame = authGuardMiddleware(async (database: Repo, ctx: Ctx) => {
  const chatId = ctx.chat.id;
  try {
    const room = await database.roomRepo.getRoom(chatId);
    if (room.state === 'PLAYING') {
      ctx.reply('Игра уже началась');
      return;
    }
    if (room.players.length < MIN_PLAYER_FOR_START) {
      ctx.reply('Недостаточно игроков для начала игры');
      return;
    }
    if (room.players.length > MIN_PLAYER_FOR_START) {
      ctx.reply('Слишком много игроков для начала игры');
      return;
    }

    const { players } = room;
    const firstPair = compose(selectPlayer<number>, selectPlayer<number>)({ others: players, selected: [] });
    const secondPair = compose(selectPlayer<number>, selectPlayer<number>)({ others: firstPair.others, selected: [] });

    const firstCouple: Couple = [firstPair.selected[0], firstPair.selected[1]];
    const secondCouple: Couple = [secondPair.selected[0], secondPair.selected[1]];
    await database.roomRepo.setFirstPair(chatId, firstCouple);
    await database.roomRepo.setSecondPair(chatId, secondCouple);
    await database.roomRepo.updateRoomState(chatId, 'PLAYING');

    const first = await database.userRepo.getUser(firstPair.selected[0]);
    const second = await database.userRepo.getUser(firstPair.selected[1]);
    const third = await database.userRepo.getUser(secondPair.selected[0]);
    const fouth = await database.userRepo.getUser(secondPair.selected[1]);

    const reply = `Играют:
    Первая команда: ${getMentionOfUser(first.id, first.name)} ${getMentionOfUser(second.id, second.name)}
    Вторая команда: ${getMentionOfUser(third.id, third.name)} ${getMentionOfUser(fouth.id, fouth.name)}\nКто победил?
    `
    ctx.replyWithHTML(
      reply,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `${first.name}\n & \n${second.name}`,
                callback_data: "first team win"
              },
              {
                text: `${third.name}\n & \n${fouth.name}`,
                callback_data: "second team win"
              }
            ],
          ]
        }
      }
    );
  } catch (error) {
    ctx.reply('Произошла ошибка');
  }
});

export type ActionCtx = NarrowedContext<Context<Update> & {
  match: RegExpExecArray;
}, Update.CallbackQueryUpdate<CallbackQuery>>

export const handleTeamWin = async (database: Repo, ctx: ActionCtx, team: 'first' | 'second') => {
  const chatId = ctx.chat.id;
  const room = await database.roomRepo.getRoom(chatId);
  if (room.state === 'IDLE') {
    ctx.reply('Сейчас игра не ведется');
    return;
  }
  if (!room.first.length || !room.second.length) {
    ctx.reply('Игры не существует');
    return;
  }

  const [id1, id2] = room.first;
  const [id3, id4] = room.second;

  const addGameToHistoryAndGetReply = async (winners: Couple, losers: Couple) => {
    const [id1, id2] = winners;
    const [id3, id4] = losers;
    const game: Game = {
      chatId,
      date: new Date(Date.now()),
      winners: [id1, id2],
      losers: [id3, id4],
    }
    await database.historyRepo.addGame(game);
    await database.roomRepo.clearPairs(chatId);
    await database.roomRepo.setPlayersToRoom(chatId, []);
    await database.roomRepo.updateRoomState(chatId, 'IDLE');

    const winner1 = await database.userRepo.getUser(id1);
    const winner2 = await database.userRepo.getUser(id2);
    const loser1 = await database.userRepo.getUser(id3);
    const loser2 = await database.userRepo.getUser(id4);

    return `
      Очки засчитаны
      Победили ${getMentionOfUser(winner1.id, winner1.name)} & ${getMentionOfUser(winner2.id, winner2.name)}
      Проиграли ${getMentionOfUser(loser1.id, loser1.name)} & ${getMentionOfUser(loser2.id, loser2.name)}
    `;
  }

  ctx.replyWithHTML(
    team === 'first'
      ? await addGameToHistoryAndGetReply([id1, id2], [id3, id4])
      : await addGameToHistoryAndGetReply([id3, id4], [id1, id2]),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: `Взять реванш!`, callback_data: `replay?id1=${id1}&id2=${id2}&id3=${id3}&id4=${id4}` }],
        ]
      }
    }
  );
};

export const replayHandler = async (database: Repo, ctx: ActionCtx) => {
  const clbQuery = ctx.update.callback_query;
  if (!('data' in clbQuery)) {
    ctx.reply('Произошла ошибка');
    return;
  }
  const query = clbQuery.data;
  const chatId = ctx.chat.id;
  const indexOfParamsStart = query.indexOf('?') + 1;
  const params = query.slice(indexOfParamsStart);
  const urlParams = new URLSearchParams(params);
  const paramsObject = Object.fromEntries(urlParams);
  const firstCouple: Couple = [+paramsObject.id1, +paramsObject.id2];
  const secondCouple: Couple = [+paramsObject.id3, +paramsObject.id4];

  await database.roomRepo.setFirstPair(chatId, firstCouple);
  await database.roomRepo.setSecondPair(chatId, secondCouple);
  await database.roomRepo.updateRoomState(chatId, 'PLAYING');

  const first = await database.userRepo.getUser(firstCouple[0]);
  const second = await database.userRepo.getUser(firstCouple[1]);
  const third = await database.userRepo.getUser(secondCouple[0]);
  const fouth = await database.userRepo.getUser(secondCouple[1]);

  const reply = `Играют:
  Первая команда: ${getMentionOfUser(first.id, first.name)} ${getMentionOfUser(second.id, second.name)}
  Вторая команда: ${getMentionOfUser(third.id, third.name)} ${getMentionOfUser(fouth.id, fouth.name)}\nКто победил?
  `
  ctx.replyWithHTML(
    reply,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: `${first.name}\n & \n${second.name}`, callback_data: "first team win" }, { text: `${third.name}\n & \n${fouth.name}`, callback_data: "second team win" }],
        ]
      }
    }
  );
}
