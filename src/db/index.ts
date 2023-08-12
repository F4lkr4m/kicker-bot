import fs from 'fs';
import { Collection, ObjectId, MongoClient } from 'mongodb';
import { DATABASE_NAME } from './constants';
import { Room } from './Room/types';
import { User } from './Users/types';
import { USER_REPO_ERRORS, UserRepo } from './Users';
import { GameHistoryRepo } from './Games';
import { Game } from './Games/types';
import { RoomsRepo } from './Room';
require('dotenv').config();
const client = new MongoClient(process.env.MONGO_URI);

export interface Repo {
  historyRepo: GameHistoryRepo,
  userRepo: UserRepo,
  roomRepo: RoomsRepo,
}

export const initDB = async (): Promise<Repo> => {
  const database = client.db(DATABASE_NAME);
  const historyRepo = new GameHistoryRepo(database);
  const userRepo = new UserRepo(database);
  const roomRepo = new RoomsRepo(database);
  return {
    historyRepo,
    userRepo,
    roomRepo,
  };
};


// export const runDB = async () => {
//   // const DB = await initDB();
//   // const userRepo = new UserRepo(DB);
//   // const historyRepo = new GameHistoryRepo(DB);

//   // const user: User = {
//   //   id: 1234,
//   //   name: 'Никита',
//   //   statistics: {},
//   // };

//   try {

//     // const count = await historyRepo.getWinsForPair(125, 126);

//     // const game: Game = {
//     //   date: new Date(Date.now()),
//     //   chatId: 123,
//     //   winners: [125, 129],
//     //   losers: [111, 222],
//     // }
//     // historyRepo.addGame(game)

//     const room: Room = { 
//       id: 123,
//       players: [],
//       state: 'IDLE',
//     }

//     const roomsRepo = new RoomsRepo(DB);

//     await roomsRepo.addRoom(room);
//     await roomsRepo.addPlayerToRoom(room.id, 123);
//     await roomsRepo.addPlayerToRoom(room.id, 124);
//     await roomsRepo.addPlayerToRoom(room.id, 125);
//     await roomsRepo.addPlayerToRoom(room.id, 126);
//     const room1 = await roomsRepo.getRoom(room.id);
//     console.log(room1)
//     await roomsRepo.setPlayersToRoom(room.id, [1, 2, 3, 4]);
//     const room2 = await roomsRepo.getRoom(room.id);
//     console.log(room2)
//     await roomsRepo.removePlayerFromRoom(room.id, 4);
//     const room3 = await roomsRepo.getRoom(room.id);
//     console.log(room3)
//     await roomsRepo.addPlayerToRoom(room.id, 4);
//     const room4 = await roomsRepo.getRoom(room.id);
//     console.log(room4)
//     await roomsRepo.updateRoomState(room.id, 'PLAYING');
//     const room5 = await roomsRepo.getRoom(room.id);
//     console.log(room5)
//     await roomsRepo.setPlayersToRoom(room.id, []);
//     const room6 = await roomsRepo.getRoom(room.id);
//     console.log(room6)

//     // console.log('wins', count);
//     // await userRepo.createUser(user);
//     // const gettedUser = await userRepo.getUser(user.id + 1);
//   } catch (error) {
//     switch (error.message) {
//       case USER_REPO_ERRORS.USER_ALREADY_EXISTS:
//         console.log(USER_REPO_ERRORS.USER_ALREADY_EXISTS);
//         break;
//       case USER_REPO_ERRORS.USER_NOT_EXISTS: 
//         console.log(USER_REPO_ERRORS.USER_NOT_EXISTS);
//         break;
//       default: 
//         console.log('other error');
//     }
//   }
// };





















const readFile = async (filename: string) => new Promise((resolve, reject) => {
  fs.readFile(filename, ENCODING, (err, data) => {
    if (err) {
      console.error(err);
      reject(err);
    }

    resolve(JSON.parse(data));
  });
});

const writeFile = async (filename: string, data: any) => new Promise((resolve, reject) => {
  fs.writeFile(filename, JSON.stringify(data), ENCODING, (err) => {
    if (err) {
      reject(err);
    }
    resolve(null);
  })
});



const ENCODING = 'utf8';

export const getDatabase = async () => {
  try {
    const db = await readFile('./db.json');
    return db as any;
  } catch (error) {
    console.error(error);
  }
}

export const writeDatabase = async (data: any) => {
  try {
    await writeFile('./db.json', data);
    return;
  } catch (error) {
    console.error(error);
  }
}
