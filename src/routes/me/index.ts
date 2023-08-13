import { authGuardMiddleware } from "../../middleware";
import { Ctx } from "../../types";
import { getMentionOfUser } from "../../utils/getMentionOfUser";
import { Repo } from "../../db";


export const meCommand = authGuardMiddleware(async (database: Repo, ctx: Ctx) => {
  const id = ctx.message.from.id;
  const reply = await getUserStatById(database, ctx.chat.id, id);
  ctx.replyWithHTML(reply);
});

export const getUserStatById = async (database: Repo, chatId: number, id: number): Promise<string> => {
  try {
    const user = await database.userRepo.getUser(id);

    const usersSet = new Set<number>();
    const games = await database.historyRepo.getGamesForUserAndChat(chatId, id);
    games.forEach((g) => {
      if (g.losers.includes(id)) {
        usersSet.add(g.losers.find((allyId) => allyId !== id));
        return;
      }
      usersSet.add(g.winners.find((allyId) => allyId !== id));
    });
    let reply = `Статистика игрока ${getMentionOfUser(id, user.name)}\n`;
    for (const allyId of [...usersSet]) {
      const ally = await database.userRepo.getUser(allyId);
      const wins = await database.historyRepo.getWinsForPair(allyId, id);
      const loses = await database.historyRepo.getLosesForPair(allyId, id);
      reply = reply.concat(`${getMentionOfUser(ally.id, ally.name)} - ${wins} / ${loses}\n`);
    }

    const allWins = await database.historyRepo.getWinsForUser(id);
    const allLoses = await database.historyRepo.getLosesForUser(id);
    const winrate = (((allWins) / (allWins + allLoses)) * 100).toFixed();

    reply = reply.concat(`\nПроцент побед: ${isNaN(+winrate) ? 0 : winrate} %`);
    return reply;
  } catch (error) {
    return 'Произошла ошибка'
  }
}