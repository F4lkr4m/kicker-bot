import { compose } from "rambda";
import { Ctx } from "../../types";
import { Repo } from "../../db";
import { randomInt } from 'crypto'

export const rollCommand = (database: Repo, ctx: Ctx) => {
  ctx.reply(compose(rollPairs, clearCommandMessage)(ctx.message.text))
}

const getRandomInt = (min: number, max: number) => randomInt(min, max);

interface SelectedPlayers<T> {
  selected: T[],
  others: T[],
}

export const selectPlayer = <T>({ selected, others }: SelectedPlayers<T>): SelectedPlayers<T> => {
  const randomIndex = getRandomInt(0, others.length);
  const newSelected = [...selected, others[randomIndex]];
  const newOthers = others.filter((_, index) => index !== randomIndex);
  return {
    selected: newSelected,
    others: newOthers
  };
};

const MIN_PLAYERS_FOR_ROLL = 4;

const rollPairs = (playersStr: string) => {
  const names = playersStr.split(' ');

  if (names.length < MIN_PLAYERS_FOR_ROLL) {
    return 'Ошибка, недостаточно игроков';
  }

  const firstRoll = compose(selectPlayer<string>, selectPlayer<string>)({ others: names, selected: [] });
  const secondRoll = compose(selectPlayer<string>, selectPlayer<string>)({ others: firstRoll.others, selected: [] });

  const msg = `1ая пара игроков - ${firstRoll.selected.join(' ')}
    \n2ая пара игроков - ${secondRoll.selected.join(' ')}
    \nМеняющиеся игроки - ${secondRoll.others.join(' ')}`;

  return msg;
};

const clearCommandMessage = (message: string): string => {
  const [, ...msg] = message.split(' ');
  return msg.join(' ');
}
