import { addUser, getUser } from "../db/Users";
import { User } from "../db/Users/types";
import { Ctx } from "../types";

export const authGuardMiddleware = <T extends Function>(handler: T): (ctx: Ctx) => Promise<void> => {
  return async (ctx: Ctx) => {
    const id = ctx.message.from.id;
    try {
      await getUser(id);
    } catch (error) {
      if (error.message === 'user not exists') {
        const newUser: User = {
          name: ctx.message.from.first_name,
          id: id,
          wins: {},
          loses: {}, 
        };
        await addUser(newUser);
      }
    }
    await handler(ctx);
  }
}