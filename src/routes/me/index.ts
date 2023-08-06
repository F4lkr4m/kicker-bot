import { addUser, getUser } from "../../db/Users";
import { User } from "../../db/Users/types";
import { authGuardMiddleware } from "../../middleware";
import { Ctx } from "../../types";
import { getMentionOfUser } from "../../utils/getMentionOfUser";


export const meCommand = authGuardMiddleware(async (ctx: Ctx) => {
  const id = ctx.message.from.id;

  try {
    const user = await getUser(id);

    const wins = user.wins;
    const loses = user.loses;
    const users = Object.keys(wins);
    let reply = '';
    for (let userId of users) {
      const userAlly = await getUser(+userId);
      reply = `${reply}\n ${getMentionOfUser(userAlly.id, userAlly.name)} - ${wins[userAlly.id] ?? 0}/${loses[userAlly.id] ?? 0}`;
    }
    
    const str = user 
    ? `Игрок ${getMentionOfUser(id, user.name)}
      Статистика: ${reply}
    `
    : 'Произошла ошибка';

  ctx.replyWithHTML(str);
  } catch (error) {
    ctx.reply('Произошла ошибка');
  }
});