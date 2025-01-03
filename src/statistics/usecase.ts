import { getMentionOfUser } from "../utils/getMentionOfUser";
import { getWinrate } from "../utils/getWinrateByUserId";
import { getMondayFromDate } from "../utils/getMondayFromDate";
import { User } from "../db/Users/types";
import { format } from 'date-fns';
import {getTeamMsg} from "../utils/getTeamMsg";
import { UserRepo } from "@/db/Users";
import { GameHistoryRepo } from "@/db/Games";


const getOthers = (id: number) => (currentId: number) => {
  return currentId !== id;
}

export interface StatisticsUsecaseType {
  userRepo: UserRepo;
  historyRepo: GameHistoryRepo;
  getUserStatById: (chatId: number, id: number) => Promise<string>;
}

export class StatisticsUsecase implements StatisticsUsecaseType {
  userRepo: UserRepo;
  historyRepo: GameHistoryRepo;

  constructor(userRepo: UserRepo, historyRepo: GameHistoryRepo) {
    this.userRepo = userRepo;
    this.historyRepo = historyRepo;
  }

  getUserStatById = async (chatId: number,id: number): Promise<string> => {
    const userRepo = this.userRepo;
    const historyRepo = this.historyRepo;
    try {
      const user = await userRepo.getUser(id);
  
      const alliesSet = new Set<number>();
      const games = await historyRepo.getGamesForUserAndChat(chatId, id);
  
      if (!games.length) {
        return `У игрока ${getMentionOfUser(id, user.name)} нет сохранённых игр`;
      }
  
      games.forEach((game) => {
        const userHasAllies = game.winners.length > 1 || game.losers.length > 1;
  
        if (!userHasAllies) {
          return;
        }
  
        if (game.losers.includes(id)) {
          alliesSet.add(game.losers.find(getOthers(id)));
          return;
        }
  
        alliesSet.add(game.winners.find(getOthers(id)));
      });
  
      let statsByAllies = '';
      for (const allyId of [...alliesSet]) {
        const ally = await userRepo.getUser(allyId);
        const wins = await historyRepo.getWinsForPair(allyId, id);
        const loses = await historyRepo.getLosesForPair(allyId, id);
  
        statsByAllies = statsByAllies.concat(
          `<b>${ally.name}</b> - ${wins} / ${loses}\n`,
        );
      }
  
      const weekAgo = getMondayFromDate(new Date());
      weekAgo.setUTCHours(0, 0, 0, 0);
  
      const last10Games = await historyRepo.getGamesForUserAndChat(
        chatId,
        id,
        weekAgo,
        10,
      );
      const usersMap = new Map<number, User>();
      let index = 0;
      let last10GamesMsg = '';
      for (const game of last10Games) {
        index++;
        const players = [...game.losers, ...game.winners];
        for (const playerId of players) {
          if (usersMap.has(playerId)) continue;
          const player = await userRepo.getUser(playerId);
          usersMap.set(playerId, player);
        }
  
        const [id1, id2] = game.winners;
        const [id3, id4] = game.losers;
  
        const user1 = usersMap.get(id1);
        const user2 = id2 ? usersMap.get(id2) : undefined;
        const user3 = usersMap.get(id3);
        const user4 = id4 ? usersMap.get(id4) : undefined;
  
        const date = format(new Date(game.date), 'dd.MM.yyyy');
  
        const isWinner = Boolean(game.winners.includes(id));
        const gameResultIcon = isWinner ? '✅' : '❌';
  
        last10GamesMsg += `${index}. ${gameResultIcon} ${date} ${getTeamMsg(user1.name, user2?.name)} <b>VS</b> ${getTeamMsg(user3.name, user4?.name)}\n`;
      }
  
      const winRate = (
        await getWinrate(historyRepo, id, chatId)
      ).toFixed();
  
      const titleOfReply = `Статистика игрока ${getMentionOfUser(id, user.name)}\n`;
      const titleOfHistoryMsg = '\n<b>Последние 10 игр:</b>\n';
      const winRateMsg = `\nПроцент побед: ${isNaN(+winRate) ? 0 : winRate} %`;
  
      return [
        titleOfReply,
        statsByAllies,
        titleOfHistoryMsg,
        last10GamesMsg,
        winRateMsg
      ].join('');
    } catch (error) {
      console.log(error);
      return 'Произошла ошибка';
    }
  };
}

