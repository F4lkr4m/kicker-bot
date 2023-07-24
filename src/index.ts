import { Telegraf } from 'telegraf';
import { compose } from 'rambda';
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

interface Player {
  name: string,
}

const playerNames = [
  'Соня',
  'Искандер',
  'Дима',
  'Денис',
  'Миша',
  'Захар',
  'Серега',
  'Никита'
];

let players: Player[] = playerNames.map((name) => ({ name }));

const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

interface SelectingPlayers {
  othersPlayers: Player[],
  selectedPlayers: Player[],
}

const selectPlayer = (players: SelectingPlayers): SelectingPlayers => {
  const { othersPlayers, selectedPlayers } = players;
  const randomIndex = getRandomInt(0, othersPlayers.length);
  const player = othersPlayers[randomIndex];
  return {
    othersPlayers: othersPlayers.filter(({ name }) => name !== player.name),
    selectedPlayers: [...selectedPlayers, player],
  }
}


const rollPairs = (): string => {
  const {selectedPlayers: firstPair, othersPlayers} = compose(selectPlayer, selectPlayer)({ othersPlayers: players, selectedPlayers: [] });
  const {selectedPlayers: secondPair} = compose(selectPlayer, selectPlayer)({ othersPlayers, selectedPlayers: []});

  const msg = `1ая пара игроков - ${playersToString(firstPair)}\n2ая пара игроков - ${playersToString(secondPair)}`;
  return msg
};

const playersToString = (players: Player[]) => {
  const names = players.map(({ name }) => name);
  return names.join(' ');
}

const clearCommandMessage = (message: string): string => {
  const spaceSplitted = message.split(' ');
  return spaceSplitted[1];
}

const setPlayersForRolling = (playersString: string): string => {
  try {
    const names = playersString.split(',');
    players = names.map((name) => ({ name }));
    return 'Набор игроков изменен'
  } catch (error) {
    return 'Произошла ошибка'
  }
}

bot.command('roll', (ctx) => ctx.reply(rollPairs()));
bot.command('players', (ctx) => ctx.reply(playersToString(players)));
bot.command('set', (ctx) => ctx.reply(compose(setPlayersForRolling, clearCommandMessage)(ctx.message.text)));
bot.command('hipster', Telegraf.reply('λ'));
bot.command('help', (ctx) => {
  const helpText = `\
    Чак Норрис на связи!\n
    Прочитай эту инструкцию и сможешь как я - делать шпагат на двух летящих самолетах ;)\n
    /players - вывести всех игроков\n
    /roll - произвести выбор двух пар из ВСЕХ игроков\n
    /set {names} - names - имена игроков через запятую и без пробелов пример:"Соня,Денис,Миша,Дима"\n
  `
  ctx.reply(helpText);
})
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));