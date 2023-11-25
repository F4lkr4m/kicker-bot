import { randomInt } from 'crypto'

export const getRandomInt = (min: number, max: number) => randomInt(min, max);
