import { USER_REPO_ERRORS, UserRepo, } from "../db/Users";
import { User } from "../db/Users/types";
import { ActionCtx, Ctx } from "../types";

export type Middleware = (ctx: Ctx | ActionCtx) => Promise<void>

// Создает пользователя, если его не существует.
export const authGuardMiddleware = (userRepo: UserRepo): Middleware => {
  return async (ctx: Ctx | ActionCtx) => {
    const id = ctx.message.from.id;
    try {
      const user = await userRepo.getUser(id);
      if (ctx.from.username && !user.username) {
        const updatedUser: User = {
          ...user,
          username: ctx.from.username,
        }
        userRepo.udpateUser(updatedUser);
      }
    } catch (error) {
      if (error.message === USER_REPO_ERRORS.USER_NOT_EXISTS) {
        const newUser: User = {
          id,
          name: ctx.message.from.first_name,
          username: ctx.from.username,
        }
        await userRepo.createUser(newUser);
        ctx.reply('Пользователь создан');
      }
    }
  }
}