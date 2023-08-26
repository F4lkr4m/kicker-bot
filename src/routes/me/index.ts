import { authGuardMiddleware } from "../../middleware";
import { Ctx } from "../../types";
import { getMentionOfUser } from "../../utils/getMentionOfUser";
import { Repo } from "../../db";
import { getWinrate } from "../../utils/getWinrateByUserId";
import { getMondayFromDate } from "../../utils/getMondayFromDate";
import { User } from "../../db/Users/types";
import { format } from 'date-fns';


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
      reply = reply.concat(`<b>${ally.name}</b> - ${wins} / ${loses}\n`);
    }

    const weekAgo = getMondayFromDate(new Date());
    weekAgo.setUTCHours(0, 0, 0, 0);

    const last10Games = await database.historyRepo.getGamesForUserAndChat(
      chatId,
      id,
      weekAgo,
      10
    );

    let historyReply = '\n<b>Последние 10 игр:</b>\n';
    const usersMap = new Map<number, User>();
    let index = 0;
    for (const game of last10Games) {
      index++;
      const players = [...game.losers, ...game.winners];
      for (const playerId of players) {
        if (usersMap.has(playerId)) { continue; }
        const player = await database.userRepo.getUser(playerId);
        usersMap.set(playerId, player);
      }


      const [id1, id2] = game.winners;
      const [id3, id4] = game.losers;

      const user1 = usersMap.get(id1);
      const user2 = usersMap.get(id2);
      const user3 = usersMap.get(id3);
      const user4 = usersMap.get(id4);

      const date = format(new Date(game.date), 'dd/MM/yyyy');

      const isWinner = Boolean(game.winners.includes(id));
      const gameResultText = isWinner ? '✅' : '❌'

      historyReply += `${index} - ${gameResultText} ${date} ${user1.name} & ${user2.name} <b>VS</b> ${user3.name} & ${user4.name}\n`;
    }
    const winrate = (await getWinrate(database.historyRepo, id, chatId)).toFixed();
    reply = reply.concat(`${historyReply}\n`);
    reply = reply.concat(`\nПроцент побед: ${isNaN(+winrate) ? 0 : winrate} %`);
    return reply;
  } catch (error) {
    console.log(error);
    return 'Произошла ошибка'
  }
}