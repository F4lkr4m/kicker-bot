import { GameHistoryRepo } from "../db/Games";

export const getWinrate = async (historyRepo: GameHistoryRepo, id: number, date?: Date) => {
  const allWins = await historyRepo.getWinsForUser(id, date);
  const allLoses = await historyRepo.getLosesForUser(id, date);
  return ((allWins) / (allWins + allLoses)) * 100;
}