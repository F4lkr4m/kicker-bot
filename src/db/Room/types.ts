import { User } from "../Users/types";

export type RoomState = 'PLAYING' | 'IDLE';
export type Couple = [number, number];

export interface Room {
  id: number,
  players: number[],
  state: RoomState,
  first: Couple | [],
  second: Couple | [],
}