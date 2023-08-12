import { Ctx, CtxWithDatabase } from "../types";
import { Repo } from "../db";
import { ActionCtx } from "../routes/room";

export const enrichHandler = (handler: (database: Repo, ctx: Ctx | ActionCtx) => void | Promise<void>, database: Repo) => {
  return (ctx) => handler(database, ctx);
}