type UserId = number;
type Count = number;

export interface Statistic {
  wins?: Count,
  loses?: Count,
}

export interface User {
  id: number,
  name: string,
  statistics: Partial<Record<UserId, Statistic>>
}