import { ActionCtx } from "@/types";
import { Ctx, UsecaseHandleReturn, isReplyWithOptions } from "@/types";

export const replyWithHTMLByType = (ctx: Ctx | ActionCtx, reply: Awaited<UsecaseHandleReturn>) => {
    if (isReplyWithOptions(reply)) {
        ctx.replyWithHTML(...reply);
        return;
    }
    ctx.replyWithHTML(reply);
}