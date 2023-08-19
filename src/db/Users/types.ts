type UserId = number;
type Count = number;

export interface Statistic {
  wins?: Count,
  loses?: Count,
}

export interface User {
  id: UserId,
  name: string,
  username?: string,
}