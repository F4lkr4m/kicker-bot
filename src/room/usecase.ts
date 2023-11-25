import { compose } from "rambda";
import { ROOM_REPO_ERRORS, RoomsRepo } from "../db/Room";
import { Couple, Room } from "../db/Room/types";
import { getMentionOfUser } from "@/utils/getMentionOfUser";
import {
  CallbackQuery,
  InlineKeyboardButton,
} from 'telegraf/typings/core/types/typegram';
import { Game } from "../db/Games/types";
import { URLSearchParams } from "url";
import { USER_REPO_ERRORS, UserRepo } from "@/db/Users";
import { User } from "../db/Users/types";
import { getTeamMsg } from "../utils/getTeamMsg";
import { resolveCouple } from "../utils/resolveCouple";
import { getReplyFromGame } from "../utils/getReplyFromGame";
import { MAX_PLAYER_FOR_START, MIN_PLAYER_FOR_START } from './constants';
import { GameHistoryRepo } from "@/db/Games";
import { UsecaseHandleReturn } from "@/types";
import { selectOne } from "@/utils/selectOne";

export interface RoomUsecaseType {
  roomRepo: RoomsRepo;
  userRepo: UserRepo;
  historyRepo: GameHistoryRepo;
  createRoom: (chatId: number) => Promise<string>;
  clearRoomHandle: (chatId: number) => Promise<string>;
  exitCommand: (chatId: number, playerId: number) => Promise<string>;
  removeCommand: (chatId: number, message: string) => UsecaseHandleReturn;
  removePlayerAction: (chatId: number, clbQuery: CallbackQuery) => Promise<string>;
  addPlayer: (chatId: number, userId: number, message: string) => Promise<string>;
  showPlayers: (chatId: number) => UsecaseHandleReturn;
  startGame: (chatId: number) => UsecaseHandleReturn;
  handleTeamWin: (chatId: number, team: 'first' | 'second') => UsecaseHandleReturn;
  replayHandler: (chatId: number, clbQuery: CallbackQuery) => UsecaseHandleReturn;
  cancelCommand: (chatId: number) => Promise<string>;
}

export class RoomUsecase implements RoomUsecaseType {
  roomRepo: RoomsRepo;
  userRepo: UserRepo;
  historyRepo: GameHistoryRepo;

  constructor(roomRepo: RoomsRepo, userRepo: UserRepo, historyRepo: GameHistoryRepo) {
    this.roomRepo = roomRepo;
    this.userRepo = userRepo;
    this.historyRepo = historyRepo;
  }

  createRoom = async (chatId: number) => {
    try {
      const newRoom: Room = {
        id: chatId,
        players: [],
        state: 'IDLE',
        first: [],
        second: [],
      }
      await this.roomRepo.addRoom(newRoom);
      return 'Комната создана';
    } catch (error) {
      if (error.message === ROOM_REPO_ERRORS.ROOM_ALREADY_EXISTS) {
        return 'Комната уже создана';
      }
      return 'Произошла ошибка';
    }
  };

  clearRoomHandle = async (chatId: number) => {
    const room = await this.roomRepo.getRoom(chatId);
    if (room.state === 'PLAYING') {
      return 'Нельзя очистить комнату, которая находится в процессе игры';
    }
  
    try {
      await this.roomRepo.setPlayersToRoom(chatId, []);
      return 'Комната успешно очищена';
    } catch (error) {
      return 'Произошла ошибка';
    }
  };

  // auth
  exitCommand = async (chatId: number, playerId: number) => {  
    try {
      await this.roomRepo.removePlayerFromRoom(chatId, playerId);
      return 'Вы вышли из комнаты';
    } catch (error) {
      return 'Произошла ошибка';
    }
  };

  // auth
  removeCommand = async (chatId: number, message: string): UsecaseHandleReturn => {
    const [, ...text] = message.split(' ');
  
    if (text.length) {
      let reply = '';
      const usersToRemove: User[] = [];
      for (const elem of text) {
        if (elem.startsWith('@')) {
          const username = elem.slice(1);
          try {
            const userToRemove = await this.userRepo.getUserByUsername(username);
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
          await this.roomRepo.removePlayerFromRoom(chatId, removingUser.id);
          reply += `Пользователь ${removingUser.username} удалён из комнаты\n`;
        } catch (error) {
          if (error.message === ROOM_REPO_ERRORS.USER_NOT_AT_ROOM) {
            reply += `Пользователя ${removingUser.username} нет в комнате\n`;
          } else {
            reply += `Пользователь ${removingUser.username} по неизвестной причине не был удалён из комнаты\n`;
          }
        }
      }
  
      return reply;
    }
  
    try {
      const room = await this.roomRepo.getRoom(chatId);
      if (!room.players.length) {
        return 'В комнате нет игроков';
      }
  
      const playersArr = [];
      for (const playerId of room.players) {
        const player = await this.userRepo.getUser(playerId);
        playersArr.push([player.id, player.name]);
      }
  
      const buttonPlayers: InlineKeyboardButton[][] = playersArr.map(
          ([playerId, playerName]) => ([{
            text: playerName,
            callback_data: `remove player?id=${playerId}`,
          }])
      );
  
      return [
        'Кого необходимо удалить из комнаты?',
        {
          reply_markup: {
            inline_keyboard: buttonPlayers
          },
        }
      ];
    } catch (e) {
      return 'Произошла ошибка';
    }
  };


  removePlayerAction = async (chatId: number, clbQuery: CallbackQuery) => {
    try {
      if (!('data' in clbQuery)) {
        return 'Произошла ошибка';
      }
      const query = clbQuery.data;
      const indexOfParamsStart = query.indexOf('?') + 1;
      const params = query.slice(indexOfParamsStart);
      const urlParams = new URLSearchParams(params);
      const paramsObject = Object.fromEntries(urlParams);
      const playerId = +paramsObject.id

      const userToRemove = await this.userRepo.getUser(playerId);
      try {
        await this.roomRepo.removePlayerFromRoom(chatId, userToRemove.id);
        return `Пользователь ${userToRemove.username} удалён из комнаты`;
      } catch (error) {
        if (error.message === ROOM_REPO_ERRORS.USER_NOT_AT_ROOM) {
          return `Пользователя ${userToRemove.username} нет в комнате`;
        }
        return `Пользователь ${userToRemove.username} по неизвестной причине не был удалён из комнаты`;
      }
    } catch (e) {
      return 'Произошла ошибка';
    }
  } 

  // auth
  addPlayer = async (chatId: number, userId: number, message: string) => {
    const [, ...text] = message.split(' ');
  
    let addingOtherUsersText = '';
    if (text.length) {
      const usersToAdd: User[] = [];
      for (const elem of text) {
        if (elem.startsWith('@')) {
          const username = elem.slice(1);
          try {
            const userToAdd = await this.userRepo.getUserByUsername(username);
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
          await this.roomRepo.addPlayerToRoom(chatId, addingUser.id);
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
      await this.roomRepo.addPlayerToRoom(chatId, userId);
      return `Вы были успешно добавлены в комнату\n${addingOtherUsersText}`;
    } catch (error) {
      if (error.message === ROOM_REPO_ERRORS.USER_ALREADY_AT_ROOM) {
        return `Вы уже состоите в комнате\n${addingOtherUsersText}`;
      }
      return `Произошла ошибка, вы не были добавлены в комнату\n${addingOtherUsersText}`;
    }
  };


  showPlayers = async (chatId: number): UsecaseHandleReturn => {
    try {
      const room = await this.roomRepo.getRoom(chatId);
      const playersArr = [];
      for (const playerId of room.players) {
        const player = await this.userRepo.getUser(playerId);
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
      if (room.players.length > MIN_PLAYER_FOR_START && room.players.length < MAX_PLAYER_FOR_START) {
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
      return [reply, replyOptions];
  
    } catch (error) {
      if (error.message === ROOM_REPO_ERRORS.ROOM_NOT_EXISTS) {
        return 'Комнаты не существует';
      }
      return 'Произошла ошибка';
    }
  };

  // auth
  startGame = async (chatId: number): UsecaseHandleReturn => {
    try {
      const room = await this.roomRepo.getRoom(chatId);
      if (room.state === 'PLAYING') {
        return 'Игра уже началась';
      }
      if (room.players.length % 2 === 1) {
        return 'Необходимо четное количество игроков';
      }
      if (room.players.length < MIN_PLAYER_FOR_START) {
        return 'Недостаточно игроков для начала игры';
      }
      if (room.players.length > MAX_PLAYER_FOR_START) {
        return 'Слишком много игроков для начала игры';
      }
  
      const { players } = room;
      const isPvP = players.length === 2;
  
      const firstPair = isPvP
          ? { others: [players[1]], selected: [players[0]] }
          : compose(selectOne<number>, selectOne<number>)({ others: players, selected: [] });
      const secondPair = isPvP
          ? { others: [], selected: [players[1]] }
          : compose(selectOne<number>, selectOne<number>)({ others: firstPair.others, selected: [] });
  
      const firstCouple: Couple = resolveCouple(firstPair.selected);
      const secondCouple: Couple = resolveCouple(secondPair.selected);
  
      const { reply, replyOptions } = await getReplyFromGame(this.roomRepo, this.userRepo, chatId, firstCouple, secondCouple);
      return [reply, replyOptions];
    } catch (error) {
      return 'Произошла ошибка';
    }
  };

  handleTeamWin = async (chatId: number, team: 'first' | 'second'): UsecaseHandleReturn => {
    const room = await this.roomRepo.getRoom(chatId);
    if (room.state === 'IDLE') {
      return 'Сейчас игра не ведется';
    }
    if (!room.first.length || !room.second.length) {
      return 'Игры не существует';
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
      await this.historyRepo.addGame(game);
      await this.roomRepo.clearPairs(chatId);
      await this.roomRepo.setPlayersToRoom(chatId, []);
      await this.roomRepo.updateRoomState(chatId, 'IDLE');
  
      const winner1 = await this.userRepo.getUser(id1);
      const winner2 = id2
          ? await this.userRepo.getUser(id2)
          : undefined;
      const loser1 = await this.userRepo.getUser(id3);
      const loser2 = id4
          ? await this.userRepo.getUser(id4)
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
  
    return [
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
    ];
  };

  replayHandler = async (chatId: number, clbQuery: CallbackQuery): UsecaseHandleReturn => {
    try {
      if (!('data' in clbQuery)) {
        return 'Произошла ошибка';
        return;
      }
      const query = clbQuery.data;
      const indexOfParamsStart = query.indexOf('?') + 1;
      const params = query.slice(indexOfParamsStart);
      const urlParams = new URLSearchParams(params);
      const paramsObject = Object.fromEntries(urlParams);
      const firstCouple: Couple = resolveCouple([+paramsObject.id1, +paramsObject.id2]);
      const secondCouple: Couple = resolveCouple([+paramsObject.id3, +paramsObject.id4]);
  
      const { reply, replyOptions } = await getReplyFromGame(this.roomRepo, this.userRepo, chatId, firstCouple, secondCouple);
  
      return [reply, replyOptions];
    } catch (e) {
      return 'Произошла ошибка';
    }
  };

  // auth
  cancelCommand = async (chatId: number) => {
    try {
      const room = await this.roomRepo.getRoom(chatId);
      if (room.state === 'IDLE') {
        return 'Сейчас игра не ведется';
      }
      if (!room.first.length || !room.second.length) {
        return 'Игры не существует';
      }
      await this.roomRepo.updateRoomState(chatId, 'IDLE');
      return 'Игра успешно отменена';
    } catch (error) {
      return 'Произошла ошибка';
    }
  };
}

