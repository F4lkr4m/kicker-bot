import { getDatabase, writeDatabase } from "..";
import { User } from "../Users/types";
import { Couple, Room, RoomStatus } from "./types";

export const addRoom = async (roomId: number) => {
  const room: Room = {
    id: roomId,
    players: [],
    status: 'IDLE',
  }
  const db = await getDatabase();

  if (db.rooms[roomId]) {
    throw new Error('room already exist');
  }

  db.rooms[roomId] = room;
  await writeDatabase(db);
  console.log('USER CREATED');
};

export const setRoomStatus = async (id: number, status: RoomStatus) => {
  const db = await getDatabase();
  if (!db.rooms[id]) {
    throw new Error('user not exists')
  }

  const room = db.rooms[id];
  room.status = status;
  await writeDatabase(db);
};

export const addPlayerToRoom = async (id: number, playerId: number) => {
  const db = await getDatabase();
  if (!db.rooms[id]) {
    throw new Error('room not exists')
  }
  if (db.rooms[id].players.find((userId) => userId === playerId)) {
    throw new Error('player already in')
  }

  const room = db.rooms[id] as Room;
  room.players = [...room.players, playerId];
  await writeDatabase(db);
};

export const addPlayersToRoom = async (id: number, players: number[]) => {
  const db = await getDatabase();
  if (!db.rooms[id]) {
    throw new Error('user not exists')
  }

  const room = db.rooms[id] as Room;
  room.players = [...room.players, ...players];
  await writeDatabase(db);
};

export const clearRoom = async (id: number) => {
  const db = await getDatabase();
  if (!db.rooms[id]) {
    throw new Error('user not exists')
  }

  const room = db.rooms[id] as Room;
  room.players = [];
  room.game = undefined;
  await writeDatabase(db);
};

export const getRoom = async (id: number): Promise<Room | undefined> => {
  const db = await getDatabase();
  if (!db.rooms[id]) {
    throw new Error('user not exists')
  }

  return db.rooms[id];
};

export const setGame = async (roomId: number, first: Couple, second: Couple) => {
  const db = await getDatabase();
  if (!db.rooms[roomId]) {
    throw new Error('room not exists')
  }
  const room = db.rooms[roomId] as Room;
  room.game = {
    first,
    second,
  };
  await writeDatabase(db);
};