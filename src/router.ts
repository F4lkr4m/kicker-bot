import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { Ctx } from "./types";
import { ActionCtx } from "@/types";
import { Middleware, authGuardMiddleware } from "./middleware";

export interface RouterType {
  bot: Telegraf<Context<Update>>;
  addCommand: (key: string, handler: (ctx: Ctx) => void) => void;
  addAction: (key: string, handler: (ctx: ActionCtx) => void) => void;
  addAuthProtectedCommand: (key: string, handler: (ctx: Ctx) => void) => void;
  addAuthProtectedAction: (key: string, handler: (ctx: ActionCtx) => void) => void;
}

export class Router implements RouterType {
  bot: Telegraf<Context<Update>>;
  authMiddleware: Middleware;
  constructor(bot: Telegraf<Context<Update>>, authMiddleware: Middleware) {
    this.bot = bot;
    this.authMiddleware = authMiddleware;
  }

  addCommand = (key: string, handler: (ctx: Ctx) => void) => this.bot.command(key, handler);

  addAction = (key: string, handler: (ctx: ActionCtx) => void) => this.bot.action(key, handler);

  addAuthProtectedCommand = (key: string, handler: (ctx: Ctx) => void) => {
    this.bot.command(
        key,
        async (ctx) => {
          await this.authMiddleware(ctx);
          await handler(ctx);
        }
    )
  };

  addAuthProtectedAction = (key: string, handler: (ctx: ActionCtx) => void) => {
    this.bot.action(
        key,
        async (ctx) => {
          await this.authMiddleware(ctx);
          await handler(ctx);
        }
    )
  }
}