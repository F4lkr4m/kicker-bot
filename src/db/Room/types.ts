import { User } from "../Users/types";

export type RoomStatus = 'PLAYING' | 'IDLE';
export type Couple = [number, number];

export interface Room {
  id: number,
  players: number[],
  status: RoomStatus,
  game?: {
    first: Couple,
    second: Couple,
  },
}