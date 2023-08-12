type UserId = number;

export interface Game {
  date: Date,
  chatId: number,
  winners: UserId[],
  losers: UserId[],
}
