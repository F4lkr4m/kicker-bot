import { Ctx } from "@/types";
import { LeaderBoardUsecase } from "./usecase";
import { RouterType } from "@/router";

export class LeaderBoardHandler {
    usecase: LeaderBoardUsecase;
    constructor (router: RouterType, usecase: LeaderBoardUsecase) {
        this.usecase = usecase;
        this.usecase.getLeaderBoardTotal

        router.addCommand('leaders', this.getLeaderBoardTotal);
        router.addCommand('leaders_weekly', this.getLeaderBoardWeekly);
    }

    getLeaderBoardTotal = async (ctx: Ctx) => {
        const chatId = ctx.chat.id;
        const reply = await this.usecase.getLeaderBoardTotal(chatId);
        ctx.replyWithHTML(reply);
    }

    getLeaderBoardWeekly = async (ctx: Ctx) => {
        const chatId = ctx.chat.id;
        const reply = await this.usecase.getLeaderBoardWeekly(chatId);
        ctx.replyWithHTML(reply);
    }
}