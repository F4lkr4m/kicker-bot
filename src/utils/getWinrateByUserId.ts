import { GameHistoryRepo } from "../db/Games";

export const getWinrate = async (historyRepo: GameHistoryRepo, id: number, chatId: number, date?: Date) => {
  const allWins = await historyRepo.getWinsForUser(id, chatId, date);
  const allLoses = await historyRepo.getLosesForUser(id, chatId, date);
  return ((allWins) / (allWins + allLoses)) * 100;
}