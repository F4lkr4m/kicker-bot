import { RouterType } from "@/router";
import { CommonCommandsUsecaseType } from "./usecase";
import { Ctx } from "@/types";

export class CommonCommandsHandler {
    usecase: CommonCommandsUsecaseType;
    constructor(router: RouterType, usecase: CommonCommandsUsecaseType) {
        this.usecase = usecase;

        router.addCommand('help', this.help);
        router.addCommand('roll', this.roll);
    }

    help = (ctx: Ctx) => {
        const reply = this.usecase.help();
        ctx.replyWithHTML(reply);
    };

    roll = (ctx: Ctx) => {
        const reply = this.usecase.rollPairs(String(ctx.message));
        ctx.replyWithHTML(reply);
    }
}