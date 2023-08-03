import { compose } from "rambda";
import { addPlayerToRoom, addRoom, clearRoom, getRoom, setGame, setRoomStatus } from "../../db/Room";
import { addLoseToUsers, addWinToUsers, getUser } from "../../db/Users";
import { Ctx } from "../../types";
import { getMentionOfUser } from "../../utils/getMentionOfUser";
import { selectPlayer } from "../roll";
import { Couple, Room } from "../../db/Room/types";
import { writeDatabase } from "../../db";
import { Context, NarrowedContext } from "telegraf";
import { CallbackQuery, Update } from "telegraf/typings/core/types/typegram";

export const createRoom = async (ctx: Ctx) => {
  const chatId = ctx.chat.id;
  try {
    await addRoom(chatId);
    ctx.reply('Комната создана')
  } catch (error) {
    if (error.message === 'room already exist') {
      ctx.reply('Комната уже создана');
      return;
    }
    ctx.reply('Произошла ошибка');
  }
};

export const addPlayer = async (ctx: Ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.message.from.id;
  try {
    await addPlayerToRoom(chatId, userId);
    ctx.reply('Пользователь добавлен в комнату');
  } catch (error) {
    console.log(error);
    if (error.message === 'player already in') {
      ctx.reply('Пользователь уже состоит в комнате');
      return;
    }
    ctx.reply('Произошла ошибка');
  }
};

export const showPlayers = async (ctx: Ctx) => {
  const chatId = ctx.chat.id;
  try {
    const room = await getRoom(chatId);
    let acc = '';
    for (let playerId of room.players) {
      console.log(playerId, room);
      const player = await getUser(playerId);
      console.log(player);
      acc = `${acc} ${getMentionOfUser(player.id, player.name)}`;
    }
    ctx.replyWithHTML(`Список игроков в комнате: ${acc}`);
  } catch (error) {
    ctx.reply('Произошла ошибка');
  }
};

const MIN_PLAYER_FOR_START = 4;

export const startGame = async (ctx: Ctx) => {
  const chatId = ctx.chat.id;

  try {
    const room = await getRoom(chatId);
    if (room.status === 'PLAYING') {
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
    const firstPair = compose(selectPlayer<number>, selectPlayer<number>)({ others: players, selected: []});
    const secondPair = compose(selectPlayer<number>, selectPlayer<number>)({ others: firstPair.others, selected: []});

    await setGame(chatId, firstPair.selected as Couple, secondPair.selected as Couple);
    await setRoomStatus(chatId, 'PLAYING');

    const first = await getUser(firstPair.selected[0]);
    const second = await getUser(firstPair.selected[1]);
    const third = await getUser(secondPair.selected[0]);
    const fouth = await getUser(secondPair.selected[1]);


    const reply = `Играют:
    первая пара: ${getMentionOfUser(first.id, first.name)} ${getMentionOfUser(second.id, second.name)}
    вторая пара: ${getMentionOfUser(third.id, third.name)} ${getMentionOfUser(fouth.id, fouth.name)}
    `
    ctx.replyWithHTML(
      reply,
      {
        reply_markup: {
          inline_keyboard: [
            [ { text: "Победила первая команда", callback_data: "first team win" }, { text: "Победила вторая команда", callback_data: "second team win" } ],
          ]
        }
      }
    );
  } catch (error) {
    ctx.reply('Произошла ошибка');
  }
};

type ActionCtx = NarrowedContext<Context<Update> & {
  match: RegExpExecArray;
}, Update.CallbackQueryUpdate<CallbackQuery>>

export const handleTeamWin = async (ctx: ActionCtx, team: 'first' | 'second') => {
  const chatId = ctx.chat.id;
  const room = await getRoom(chatId);
  if (room.status === 'IDLE') {
    ctx.reply('Сейчас игра не ведется');
    return;
  }
  if (!room.game) {
    ctx.reply('Игры не существует');
    return;
  }

  const first = room.game.first;
  const second = room.game.second;

  let reply = '';
  if (team === 'first') {
    console.log('before add win')
    await addWinToUsers(first[0], first[1]);
    console.log('after add win')

    await addLoseToUsers(second[0], second[1]);
    const winnerOne = await getUser(first[0]);
    const winnerTwo = await getUser(first[1]);
    const loserOne = await getUser(second[0]);
    const loserTwo = await getUser(second[1]);
    reply = `
      Очки засчитаны
      Победили ${getMentionOfUser(winnerOne.id, winnerOne.name)} ${getMentionOfUser(winnerTwo.id, winnerTwo.name)}
      Проиграли ${getMentionOfUser(loserOne.id, loserOne.name)} ${getMentionOfUser(loserTwo.id, loserTwo.name)}
    `;
  }
  if (team === 'second') {
    await addWinToUsers(second[0], second[1]);
    await addLoseToUsers(first[0], first[1]);
    const winnerOne = await getUser(second[0]);
    const winnerTwo = await getUser(second[1]);
    const loserOne = await getUser(first[0]);
    const loserTwo = await getUser(first[1]);
    reply = `
      Очки засчитаны
      Победили ${getMentionOfUser(winnerOne.id, winnerOne.name)} ${getMentionOfUser(winnerTwo.id, winnerTwo.name)}
      Проиграли ${getMentionOfUser(loserOne.id, loserOne.name)} ${getMentionOfUser(loserTwo.id, loserTwo.name)}
    `;
  }
  await setRoomStatus(chatId, 'IDLE');
  await clearRoom(chatId);
  ctx.replyWithHTML(reply);
}
