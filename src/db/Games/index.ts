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

  getGamesForChat = async (chatId: number, date?: Date) => {
    if (date) {
      return this.games.find({
        $and: [
          {
            chatId,
          },
          {
            date: {
              $gt: date,
            }
          }
        ]
      }).toArray();
    }

    return this.games.find({ chatId }).toArray();
  }

  getGamesForUserAndChat = (chatId: number, userId: number, date?: Date, limit?: number) => {
    let query = this.games.find({
      chatId,
      ...(date ? { date: { $gt: date } } : {}),
      $or: [{ winners: userId }, { losers: userId }]
    });
    if (date) {
      query = query.sort({ date: -1 });
    }
    if (limit) {
      query.limit(limit);
    }
    return query.toArray();
  }

  getWinsForUser = (userId: number, chatId: number, date?: Date) => {
    return this.games.countDocuments({
      winners: userId,
      chatId,
      ...(date
        ? {
          date: {
            $gt: date,
          }
        }
        : {})
    });
  }

  getLosesForUser = (userId: number, chatId: number, date?: Date) => {
    return this.games.countDocuments({
      losers: userId,
      chatId,
      ...(date
        ? {
          date: {
            $gt: date,
          }
        }
        : {})
    });
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
