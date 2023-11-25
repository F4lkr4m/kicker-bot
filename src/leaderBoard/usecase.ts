import { getMondayFromDate } from "@utils/getMondayFromDate";
import { getWinrate } from "@utils/getWinrateByUserId";
import { UserRepo } from "@/db/Users";
import { GameHistoryRepo } from "@/db/Games";
import { UserWithWinrate } from "./types";

export interface LeaderBoardUsecaseType {
  userRepo: UserRepo;
  historyRepo: GameHistoryRepo;
  getLeaderBoardWeekly: (chatId: number) => Promise<string>;
  getLeaderBoardTotal: (chatId: number) => Promise<string>;
}

export class LeaderBoardUsecase implements LeaderBoardUsecaseType {
  userRepo: UserRepo;
  historyRepo: GameHistoryRepo;

  constructor (userRepo: UserRepo, historyRepo: GameHistoryRepo) {
    this.userRepo = userRepo;
    this.historyRepo = historyRepo;
  }

  getLeaderBoardWeekly = async (chatId: number) => {
    const now = new Date();
    const weekAgo = getMondayFromDate(now);
    weekAgo.setUTCHours(0, 0, 0, 0);
    return await this.#getLeaderBoard(chatId, weekAgo, 'Список лидеров за неделю:');
  };

  getLeaderBoardTotal = async (chatId: number) => await this.#getLeaderBoard(chatId, undefined, 'Список лидеров за все время:');

  #getLeaderBoard = async (chatId: number, date?: Date, replyInit = '') => {
    try {
      const games = await this.historyRepo.getGamesForChat(chatId, date);
      const playersSet = new Set<number>();
      games.forEach((game) => {
        const gamePlayers = [...game.losers, ...game.winners];
        gamePlayers.forEach((player) => playersSet.add(player));
      });
  
      const uniqPlayers = Array.from(playersSet);
      const winrates: UserWithWinrate[] = [];
      for (const playerId of uniqPlayers) {
        const user = await this.userRepo.getUser(playerId);
        const winrate = await getWinrate(this.historyRepo, playerId, chatId, date);
        winrates.push({ ...user, winrate });
      }
      winrates.sort((a, b) => b.winrate - a.winrate);
  
      const reply = winrates.reduce<string>((acc, { name, winrate }, index) => {
        return acc + `${index + 1}. ${name} - ${winrate.toFixed()} %\n`;
      }, `${replyInit}\n`)
      return reply;
    } catch (error) {
      return 'Произошла неизвестная ошибка';
    }
  };  
}
