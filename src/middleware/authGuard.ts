import { Repo } from "../db";
import { USER_REPO_ERRORS,  } from "../db/Users";
import { User } from "../db/Users/types";
import { Ctx } from "../types";

export const authGuardMiddleware = (handler: (database: Repo, ctx: Ctx) => Promise<void>): (database: Repo, ctx: Ctx) => Promise<void> => {
  return async (database: Repo, ctx: Ctx) => {
    const id = ctx.message.from.id;
    try {
      await database.userRepo.getUser(id);
    } catch (error) {
      if (error.message === USER_REPO_ERRORS.USER_NOT_EXISTS) {
        const newUser: User = {
          id,
          statistics: {},
          name: ctx.message.from.first_name,
        }
        await database.userRepo.createUser(newUser);
      }
    }
    await handler(database, ctx);
  }
}