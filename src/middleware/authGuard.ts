import { Repo } from "../db";
import { USER_REPO_ERRORS, } from "../db/Users";
import { User } from "../db/Users/types";
import { Ctx } from "../types";

export const authGuardMiddleware = (handler: (database: Repo, ctx: Ctx) => Promise<void>): (database: Repo, ctx: Ctx) => Promise<void> => {
  return async (database: Repo, ctx: Ctx) => {
    const id = ctx.message.from.id;
    try {
      const user = await database.userRepo.getUser(id);
      if (ctx.from.username && !user.username) {
        const updatedUser: User = {
          ...user,
          username: ctx.from.username,
        }
        database.userRepo.udpateUser(updatedUser);
      }
    } catch (error) {
      if (error.message === USER_REPO_ERRORS.USER_NOT_EXISTS) {
        const newUser: User = {
          id,
          name: ctx.message.from.first_name,
          username: ctx.from.username,
        }
        await database.userRepo.createUser(newUser);
      }
    }
    await handler(database, ctx);
  }
}