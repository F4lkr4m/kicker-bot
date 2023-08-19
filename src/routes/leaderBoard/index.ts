import { Repo } from "../../db";
import { User } from "../../db/Users/types";
import { Ctx } from "../../types";
import { getMondayFromDate } from "../../utils/getMondayFromDate";
import { getWinrate } from "../../utils/getWinrateByUserId";

interface UserWithWinrate extends User {
  winrate: number,
}

export const getLeaderBoardWeekly = async (database: Repo, ctx: Ctx) => {
  const now = new Date();

  const weekAgo = getMondayFromDate(now);
  weekAgo.setUTCHours(0, 0, 0, 0);
  await getLeaderBoard({
    database,
    ctx,
    replyInit: 'Список лидеров за неделю:',
    date: weekAgo,
  });
};

export const getLeaderBoardTotal = async (database: Repo, ctx: Ctx) => {
  await getLeaderBoard({
    database,
    ctx,
    replyInit: 'Список лидеров за все время:'
  })
}

interface GetLeaderBoardProps {
  database: Repo,
  ctx: Ctx,
  date?: Date,
  replyInit?: string,
}

const getLeaderBoard = async (props: GetLeaderBoardProps) => {
  const { database, ctx, date, replyInit } = props;
  const chatId = ctx.chat.id;
  try {

    const games = await database.historyRepo.getGamesForChat(chatId, date);
    const playersSet = new Set<number>();
    games.forEach((game) => {
      const gamePlayers = [...game.losers, ...game.winners];
      gamePlayers.forEach((player) => playersSet.add(player));
    });

    const uniqPlayers = Array.from(playersSet);
    const winrates: UserWithWinrate[] = []
    for (const playerId of uniqPlayers) {
      const user = await database.userRepo.getUser(playerId);
      const winrate = await getWinrate(database.historyRepo, playerId, chatId, date);
      winrates.push({ ...user, winrate });
    }
    winrates.sort((a, b) => b.winrate - a.winrate);

    const reply = winrates.reduce<string>((acc, { name, winrate }, index) => {
      return acc + `${index + 1}. ${name} - ${winrate.toFixed()} %\n`;
    }, `${replyInit}\n`)
    ctx.reply(reply);
  } catch (error) {
    ctx.reply('Произошла неизвестная ошибка')
  }
};
