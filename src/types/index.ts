import { Context, NarrowedContext } from "telegraf";
import { CallbackQuery, Message, Update } from "telegraf/typings/core/types/typegram";
import { Repo } from "../db";
import * as tt from "telegraf/typings/telegram-types";

export type Ctx = NarrowedContext<
  Context<Update>,
  {
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }
>

export type CtxWithDatabase = Ctx & { database: Repo };

export type ReplyWithOptions = [string, tt.ExtraReplyMessage]

export type UsecaseHandleReturn = Promise<string | ReplyWithOptions>;

export const isReplyWithOptions = (reply: Awaited<UsecaseHandleReturn>): reply is ReplyWithOptions => {
  return Array.isArray(reply) 
}


export type ActionCtx = NarrowedContext<Context<Update> & {
    match: RegExpExecArray;
  }, Update.CallbackQueryUpdate<CallbackQuery>>
  