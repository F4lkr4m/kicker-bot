import { User } from "./types";
import { Db, Collection } from 'mongodb'

export const USER_REPO_ERRORS = {
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_EXISTS: 'USER_NOT_EXISTS',
};

export class UserRepo {
  constructor(DB: Db) {
    this.users = DB.collection<User>('users');
    this.users.createIndex({ id: 1 }, { unique: true });
  }

  private users: Collection<User>;

  getUser = async (id: number) => {
    const user = await this.users.findOne({ id });
    if (!user) {
      throw new Error(USER_REPO_ERRORS.USER_NOT_EXISTS);
    }
    return user;
  };

  createUser = async (user: User) => {
    const checkUser = await this.users.findOne({ id: user.id });
    if (!checkUser) {
      this.users.insertOne(user);
      return;
    }
    throw new Error(USER_REPO_ERRORS.USER_ALREADY_EXISTS);
  };
}
