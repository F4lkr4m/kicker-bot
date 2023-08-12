import { Telegraf, Context, NarrowedContext } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";
import { UpdateType } from "telegraf/typings/telegram-types";
import { Repo } from "../db";

export type Ctx = NarrowedContext<
  Context<Update>,
  {
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }
> 

export type CtxWithDatabase = Ctx & { database: Repo };
