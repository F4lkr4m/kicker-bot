import { Ctx } from '@/types';
import { StatisticsUsecaseType } from './usecase';
import { RouterType } from '@/router';

export class UserStatisticsHandler {
    usecase: StatisticsUsecaseType;
    constructor(router: RouterType, usecase: StatisticsUsecaseType) {
        this.usecase = usecase;

        router.addAuthProtectedCommand('me', this.getUserStat);
    }

    getUserStat = async (ctx: Ctx) => {
        const id = ctx.message.from.id;
        const chatId = ctx.chat.id;
        const reply = await this.usecase.getUserStatById(chatId, id);
        ctx.replyWithHTML(reply);
    }
}