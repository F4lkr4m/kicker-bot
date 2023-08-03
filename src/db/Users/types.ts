type UserId = number;
type Count = number;

export interface User {
  id: number,
  name: string,
  wins: Record<UserId, Count>,
  loses: Record<UserId, Count>,
}