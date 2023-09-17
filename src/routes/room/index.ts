import { compose } from "rambda";
import { Repo } from "../../db";
import { ROOM_REPO_ERRORS } from "../../db/Room";
import { Couple, Room } from "../../db/Room/types";
import { authGuardMiddleware } from "../../middleware";
import { Ctx } from "../../types";
import { getMentionOfUser } from "../../utils/getMentionOfUser";
import { selectPlayer } from "../roll";
import { Context, NarrowedContext } from "telegraf";
import {
  CallbackQuery,
  InlineKeyboardButton,
  Update,
} from 'telegraf/typings/core/types/typegram';
import { Game } from "../../db/Games/types";
import { URLSearchParams } from "url";
import { USER_REPO_ERRORS } from "../../db/Users";
import { User } from "../../db/Users/types";
import { getTeamMsg } from "../../utils/getTeamMsg";
import { resolveCouple } from "../../utils/resolveCouple";
import { getReplyFromGame } from "../../utils/getReplyFromGame";
import { MAX_PLAYER_FOR_START, MIN_PLAYER_FOR_START } from '../constants';


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

export const exitCommand = authGuardMiddleware(async (database: Repo, ctx: Ctx) => {
  const id = ctx.chat.id;
  const playerId = ctx.message.from.id;

  try {
    await database.roomRepo.removePlayerFromRoom(id, playerId);
    ctx.reply('Вы вышли из комнаты');
  } catch (error) {
    ctx.reply('Произошла ошибка');
  }
});

export const removeCommand = authGuardMiddleware(async (database: Repo, ctx: Ctx) => {
  const chatId = ctx.chat.id;
  const message = ctx.message.text;
  const [, ...text] = message.split(' ');

  if (text.length) {
    let reply = '';
    const usersToRemove: User[] = [];
    for (const elem of text) {
      if (elem.startsWith('@')) {
        const username = elem.slice(1);
        try {
          const userToRemove = await database.userRepo.getUserByUsername(username);
          usersToRemove.push(userToRemove);
        } catch (error) {
          if (error.message === USER_REPO_ERRORS.USER_NOT_EXISTS) {
            reply += `Пользователь ${username} не был найден\n`;
          }
        }
      }
    }

    for (const removingUser of usersToRemove) {
      try {
        await database.roomRepo.removePlayerFromRoom(chatId, removingUser.id);
        reply += `Пользователь ${removingUser.username} удалён из комнаты\n`;
      } catch (error) {
        if (error.message === ROOM_REPO_ERRORS.USER_NOT_AT_ROOM) {
          reply += `Пользователя ${removingUser.username} нет в комнате\n`;
        } else {
          reply += `Пользователь ${removingUser.username} по неизвестной причине не был удалён из комнаты\n`;
        }
      }
    }

    ctx.reply(reply);
    return;
  }

  try {
    const room = await database.roomRepo.getRoom(chatId);
    if (!room.players.length) {
      ctx.reply('В комнате нет игроков');
      return;
    }

    const playersArr = [];
    for (const playerId of room.players) {
      const player = await database.userRepo.getUser(playerId);
      playersArr.push([player.id, player.name]);
    }

    const buttonPlayers: InlineKeyboardButton[][] = playersArr.map(
        ([playerId, playerName]) => ([{
          text: playerName,
          callback_data: `remove player?id=${playerId}`,
        }])
    );

    ctx.replyWithHTML(
    'Кого необходимо удалить из комнаты?',
      {
        reply_markup: {
          inline_keyboard: buttonPlayers
        },
      }
    )
  } catch (e) {
    ctx.reply('Произошла ошибка');
  }
});

export const removePlayerAction = async (database: Repo, ctx: ActionCtx) => {
  try {
    const chatId = ctx.chat.id;
    const clbQuery = ctx.update.callback_query;

    if (!('data' in clbQuery)) {
      ctx.reply('Произошла ошибка');
      return;
    }
    const query = clbQuery.data;
    const indexOfParamsStart = query.indexOf('?') + 1;
    const params = query.slice(indexOfParamsStart);
    const urlParams = new URLSearchParams(params);
    const paramsObject = Object.fromEntries(urlParams);
    const playerId = +paramsObject.id

    const userToRemove = await database.userRepo.getUser(playerId);
    try {
      await database.roomRepo.removePlayerFromRoom(chatId, userToRemove.id);
      ctx.reply(`Пользователь ${userToRemove.username} удалён из комнаты`);
    } catch (error) {
      if (error.message === ROOM_REPO_ERRORS.USER_NOT_AT_ROOM) {
        ctx.reply(`Пользователя ${userToRemove.username} нет в комнате`);
      } else {
        ctx.reply(`Пользователь ${userToRemove.username} по неизвестной причине не был удалён из комнаты`);
      }
    }

  } catch (e) {
    ctx.reply('Произошла ошибка');
  }
}

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
    const playersArr = [];
    for (const playerId of room.players) {
      const player = await database.userRepo.getUser(playerId);
      playersArr.push(getMentionOfUser(player.id, player.name));
    }
    const playersList = '\t' + playersArr.join('\n\t');
    const total = `\nВсего: ${room.players.length}`;

    let helperText = '';
    if (room.players.length < MIN_PLAYER_FOR_START) {
      helperText += '\nДля игры необходимо минимум 2 игрока (а лучше 4).'
      helperText += '\nДобавляйтесь: /add';
    }
    if (room.players.length > MAX_PLAYER_FOR_START) {
      helperText += '\nДля игры необходимо максимум 4 игрока.';
      helperText += '\nКому-то придется выйти: /remove';
    }
    if (room.players.length !== MIN_PLAYER_FOR_START && room.players.length !== MAX_PLAYER_FOR_START) {
      helperText += '\nНи туда ни сюда.';
      helperText += '\nКажется одного не хватает: /add';
    }
    const replyTitle = 'Список игроков в комнате:';
    const reply = [
        replyTitle,
        playersList,
        total,
        helperText,
    ].join('\n');

    const replyOptions = (room.players.length === MIN_PLAYER_FOR_START || room.players.length === MAX_PLAYER_FOR_START)
      ? {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Начать игру', callback_data: "start game" }],
          ],
        },
      }
    : undefined;
    ctx.replyWithHTML(reply, replyOptions);

  } catch (error) {
    if (error.message === ROOM_REPO_ERRORS.ROOM_NOT_EXISTS) {
      ctx.reply('Комнаты не существует');
      return;
    }
    ctx.reply('Произошла ошибка');
  }
};

export const startGame = async (database: Repo, ctx: Ctx | ActionCtx) => {
  const chatId = ctx.chat.id;
  try {
    const room = await database.roomRepo.getRoom(chatId);
    if (room.state === 'PLAYING') {
      ctx.reply('Игра уже началась');
      return;
    }
    if (room.players.length % 2 === 1) {
      ctx.reply('Необходимо четное количество игроков');
      return;
    }
    if (room.players.length < MIN_PLAYER_FOR_START) {
      ctx.reply('Недостаточно игроков для начала игры');
      return;
    }
    if (room.players.length > MAX_PLAYER_FOR_START) {
      ctx.reply('Слишком много игроков для начала игры');
      return;
    }

    const { players } = room;
    const isPvP = players.length === 2;

    const firstPair = isPvP
        ? { others: [players[1]], selected: [players[0]] }
        : compose(selectPlayer<number>, selectPlayer<number>)({ others: players, selected: [] });
    const secondPair = isPvP
        ? { others: [], selected: [players[1]] }
        : compose(selectPlayer<number>, selectPlayer<number>)({ others: firstPair.others, selected: [] });

    const firstCouple: Couple = resolveCouple(firstPair.selected);
    const secondCouple: Couple = resolveCouple(secondPair.selected);

    const { reply, replyOptions } = await getReplyFromGame(database, chatId, firstCouple, secondCouple);

    ctx.replyWithHTML(reply, replyOptions);
  } catch (error) {
    ctx.replyWithHTML('Произошла ошибка');
  }
};

export const startCommand = authGuardMiddleware(startGame);

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
      winners: resolveCouple([id1, id2]),
      losers: resolveCouple([id3, id4]),
    }
    await database.historyRepo.addGame(game);
    await database.roomRepo.clearPairs(chatId);
    await database.roomRepo.setPlayersToRoom(chatId, []);
    await database.roomRepo.updateRoomState(chatId, 'IDLE');

    const winner1 = await database.userRepo.getUser(id1);
    const winner2 = id2
        ? await database.userRepo.getUser(id2)
        : undefined;
    const loser1 = await database.userRepo.getUser(id3);
    const loser2 = id4
        ? await database.userRepo.getUser(id4)
        : undefined;

    const winnerMsg = getTeamMsg(
        getMentionOfUser(winner1.id, winner1.name),
        getMentionOfUser(winner2?.id, winner2?.name),
        !id2
    );
    const looserMsg = getTeamMsg(
        getMentionOfUser(loser1.id, loser1.name),
        getMentionOfUser(loser2?.id, loser2?.name),
        !id4
    );

    return `
      Очки засчитаны
      Победили ${winnerMsg}
      Проиграли ${looserMsg}
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
  try {
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
    const firstCouple: Couple = resolveCouple([+paramsObject.id1, +paramsObject.id2]);
    const secondCouple: Couple = resolveCouple([+paramsObject.id3, +paramsObject.id4]);

    const { reply, replyOptions } = await getReplyFromGame(database, chatId, firstCouple, secondCouple);

    ctx.replyWithHTML(reply, replyOptions);
  } catch (e) {
    ctx.replyWithHTML('Произошла ошибка');
  }
}

export const cancelCommand = authGuardMiddleware(async (database: Repo, ctx: Ctx) => {
  try {
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
    await database.roomRepo.updateRoomState(chatId, 'IDLE');
    ctx.reply('Игра успешно отменена');
  } catch (error) {
    ctx.replyWithHTML('Произошла ошибка');
  }
})
