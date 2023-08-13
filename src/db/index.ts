import { MongoClient } from 'mongodb';
import { DATABASE_NAME } from './constants';
import { UserRepo } from './Users';
import { GameHistoryRepo } from './Games';
import { RoomsRepo } from './Room';
import { config } from 'dotenv';

config();

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
