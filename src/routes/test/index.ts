import { addUser } from "../../db/Users";
import { User } from "../../db/Users/types";
import { Ctx } from "../../types";

export const testCommand = async (ctx: Ctx) => { 
  const name = ctx.update.message.from.first_name;
  const id = ctx.update.message.from.id;

  const user: User = {
    name,
    id,
    wins: {},
    loses: {},
  }
  try {
    await addUser(user);
    ctx.reply('Аккаунт успешно создан');
  } catch (error) {
    ctx.reply('Произошла ошибка');
  }
}