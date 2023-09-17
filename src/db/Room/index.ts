
import {Couple, Room} from "./types";
import { Db, Collection } from 'mongodb';

export const ROOM_REPO_ERRORS = {
  ROOM_ALREADY_EXISTS: 'ROOM_ALREADY_EXISTS',
  ROOM_NOT_EXISTS: 'ROOM_NOT_EXISTS',
  USER_NOT_AT_ROOM: 'USER_NOT_AT_ROOM',
  USER_ALREADY_AT_ROOM: 'USER_ALREADY_AT_ROOM',
};

export class RoomsRepo {
  constructor(DB: Db) {
    this.rooms = DB.collection<Room>('rooms');
    this.rooms.createIndex({ id: 1 }, { unique: true });
  }

  private rooms: Collection<Room>;

  addRoom = async (room: Room) => {
    const checkRoom = await this.rooms.findOne({ id: room.id });
    if (checkRoom) {
      throw new Error(ROOM_REPO_ERRORS.ROOM_ALREADY_EXISTS);
    }
    await this.rooms.insertOne(room);
  };

  updateRoomState = async (id: Room['id'], state: Room['state']) => {
    const checkRoom = await this.rooms.findOne({ id });
    if (!checkRoom) {
      throw new Error(ROOM_REPO_ERRORS.ROOM_NOT_EXISTS);
    }

    await this.rooms.updateOne({ id }, { $set: { state }});
  };

  addPlayerToRoom = async (id: Room['id'], playerId: Room['players'][0]) => {
    const checkRoom = await this.rooms.findOne({ id });
    if (!checkRoom) {
      throw new Error(ROOM_REPO_ERRORS.ROOM_NOT_EXISTS);
    }
    if (checkRoom.players.find((plId) => plId === playerId)) {
      throw new Error(ROOM_REPO_ERRORS.USER_ALREADY_AT_ROOM);
    }

    await this.rooms.updateOne({ id }, { $push: { players: playerId }});
  };

  removePlayerFromRoom = async (id: Room['id'], playerId: Room['players'][0]) => {
    const checkRoom = await this.rooms.findOne({ id });
    if (!checkRoom) {
      throw new Error(ROOM_REPO_ERRORS.ROOM_NOT_EXISTS);
    }

    if (!checkRoom.players.find((plId) => plId === playerId)) {
      throw new Error(ROOM_REPO_ERRORS.USER_NOT_AT_ROOM);
    }

    await this.rooms.updateOne({ id }, { $pull: { players: playerId }});
  }

  setPlayersToRoom = async (id: Room['id'], players: Room['players']) => {
    const checkRoom = await this.rooms.findOne({ id });
    if (!checkRoom) {
      throw new Error(ROOM_REPO_ERRORS.ROOM_NOT_EXISTS);
    }
    await this.rooms.updateOne({ id }, { $set: { players }});
  };

  setFirstPair = async (id: Room['id'], couple: Couple) => {
    await this.rooms.updateOne({ id }, { $set: { first: couple }});
  };

  setSecondPair = async (id: Room['id'], couple: Couple) => {
    await this.rooms.updateOne({ id }, { $set: { second: couple }});
  };

  clearPairs = async (id: Room['id']) => {
    await this.rooms.updateOne({ id }, { $set: { second: undefined, first: undefined }});
  };

  getRoom = async (id: Room['id']) => {
    const room = await this.rooms.findOne({ id });
    if (!room) {
      throw new Error(ROOM_REPO_ERRORS.ROOM_NOT_EXISTS);
    }

    return room;
  }
}
