import { User } from "@db/Users/types";

export interface UserWithWinrate extends User {
  winrate: number,
}
