import { getDatabase, writeDatabase } from "..";
import { Db, Collection } from 'mongodb'
import { Game } from "./types";

export const USER_REPO_ERRORS = {
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_EXISTS: 'USER_NOT_EXISTS',
};

export class GameHistoryRepo {
  constructor(DB: Db) {
    this.games = DB.collection<Game>('games');
  }

  private games: Collection<Game>;

  addGame = async (game: Game) => {
    await this.games.insertOne(game)
  }

  getGamesForChat = (chatId: number) => {
    return this.games.find({ chatId });
  }

  getGamesForUserAndChat = (chatId: number, userId: number) => {
    return this.games.find({ chatId, $or: [{ winners: userId }, { losers: userId }]}).toArray();
  }

  getWinsForUser = (userId: number) => {
    return this.games.countDocuments({ "winners": userId });
  }

  getLosesForUser = (userId: number) => {
    return this.games.countDocuments({ "losers": userId });
  }

  getWinsForPair = async (id1: number, id2: number) => {
    return await this.games.countDocuments(
      {
        '$and': [
          {
            'winners': {
              '$eq': id1
            }
          }, {
            'winners': {
              '$eq': id2
            }
          }
        ]
      }
    );
  }

  getLosesForPair = async (id1: number, id2: number) => {
    return await this.games.countDocuments(
      {
        '$and': [
          {
            'losers': {
              '$eq': id1
            }
          }, {
            'losers': {
              '$eq': id2
            }
          }
        ]
      }
    );
  }
}
