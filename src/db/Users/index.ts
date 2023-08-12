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
    try {
      const user = await this.users.findOne({ id });
      if (!user) {
        throw new Error(USER_REPO_ERRORS.USER_NOT_EXISTS);
      }
      return user;
    } catch (error) {
      throw error;
    }
  };

  createUser = async (user: User) => {
    try {
      const checkUser = await this.users.findOne({ id: user.id });
      if (!checkUser) {
        this.users.insertOne(user);
        return;
      }
      throw new Error(USER_REPO_ERRORS.USER_ALREADY_EXISTS);
    } catch (error) {
      throw error;
    }
  };
}
