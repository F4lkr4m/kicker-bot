import { Telegraf } from 'telegraf';
import { Router } from './router';
import { DB } from './db';
import { config } from 'dotenv';
import { RoomUsecase } from './room/usecase';
import { LeaderBoardUsecase } from './leaderBoard/usecase';
import { StatisticsUsecase } from './statistics/usecase';
import { LeaderBoardHandler } from './leaderBoard/handler';
import { RoomHandler } from './room/handler';
import { UserStatisticsHandler } from './statistics/handler';
import { CommonCommandsUsecase } from './commonCommands/usecase';
import { CommonCommandsHandler } from './commonCommands/handler';
import { authGuardMiddleware } from './middleware';
config();

const bootstrap = () => {
  const bot = new Telegraf(process.env.BOT_TOKEN);

  const repo = DB.initDB();
  
  const userRepo = DB.userRepo;
  const historyRepo = DB.historyRepo;
  const roomRepo = DB.roomRepo;

  const authMiddleware = authGuardMiddleware(userRepo);
  
  const router = new Router(bot, authMiddleware);

  const leaderBoardUsecase = new LeaderBoardUsecase(userRepo, historyRepo);
  new LeaderBoardHandler(router, leaderBoardUsecase);

  const roomUsecase = new RoomUsecase(roomRepo, userRepo, historyRepo);
  new RoomHandler(router, roomUsecase);

  const userStatisticsUsecase = new StatisticsUsecase(userRepo, historyRepo);
  new UserStatisticsHandler(router, userStatisticsUsecase);

  const commonCommandsUsecase = new CommonCommandsUsecase();
  new CommonCommandsHandler(router, commonCommandsUsecase);

  bot.launch();
}

bootstrap();
