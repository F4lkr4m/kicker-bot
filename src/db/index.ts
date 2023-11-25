import { MongoClient } from 'mongodb';
import { DATABASE_NAME } from './constants';
import { UserRepo } from './Users';
import { GameHistoryRepo } from './Games';
import { RoomsRepo } from './Room';
import { config } from 'dotenv';

config();

export interface Repo {
  historyRepo: GameHistoryRepo,
  userRepo: UserRepo,
  roomRepo: RoomsRepo,
}

class Database implements Repo {
  roomRepo: RoomsRepo;
  userRepo: UserRepo;
  historyRepo: GameHistoryRepo;

  constructor() {}

  initDB = () => {
    const client = new MongoClient(process.env.MONGO_URI);
    const database = client.db(DATABASE_NAME);

    this.historyRepo = new GameHistoryRepo(database);
    this.userRepo = new UserRepo(database);
    this.roomRepo = new RoomsRepo(database);
  }
}

export const DB = new Database();
