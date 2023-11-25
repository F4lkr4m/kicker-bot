import { Ctx } from "@/types";
import { RoomUsecaseType } from "./usecase";
import { replyWithHTMLByType } from "@/utils/replyWithHTMLByType";
import { RouterType } from "@/router";
import { ActionCtx } from "@/types";

export class RoomHandler {
    usecase: RoomUsecaseType;
    constructor(router: RouterType, usecase: RoomUsecaseType) {
        this.usecase = usecase;

        const commands: Record<string, (ctx: Ctx) => void> = {
            'room': this.showPlayers,
            'create': this.createRoom,
        }
        
        const protectedCommands: Record<string, (ctx: Ctx) => void> = {
            'add':  this.addPlayer,
            'exit': this.exitFromRoom,
            'remove': this.removeFromRoom,
            'start': this.startGame,
            'clear': this.clearRoom,
            'cancel': this.cancelGame,
        }

        const protectedActions: Record<string, (ctx: ActionCtx) => void> = {
            'first team win': (ctx: ActionCtx) => this.handleTeamWin(ctx, 'first'),
            'second team win': (ctx: ActionCtx) => this.handleTeamWin(ctx, 'second'),
            'replay': this.replayHandler,
            'start game': this.startGame,
            'remove player': this.removePlayerAction,
        }

        Object.entries(commands).forEach(([key, value]) => router.addCommand(key, value));
        Object.entries(protectedCommands).forEach(([key, value]) => router.addAuthProtectedCommand(key, value));
        Object.entries(protectedActions).forEach(([key, value]) => router.addAction(key, value));
    }

    createRoom = async (ctx: Ctx) => {
        const reply = await this.usecase.createRoom(ctx.chat.id);
        ctx.replyWithHTML(reply);
    };

    clearRoom = async (ctx: Ctx) => {
        const reply = await this.usecase.clearRoomHandle(ctx.chat.id);
        ctx.replyWithHTML(reply);
    }

    exitFromRoom = async (ctx: Ctx) => {
        const reply = await this.usecase.exitCommand(ctx.chat.id, ctx.from.id);
        ctx.replyWithHTML(reply);
    }

    removeFromRoom = async (ctx: Ctx) => {
        const reply = await this.usecase.removeCommand(ctx.chat.id, String(ctx.message));
        replyWithHTMLByType(ctx, reply);
    }

    removePlayerAction = async (ctx: ActionCtx) => {
        const reply = await this.usecase.removePlayerAction(ctx.chat.id, ctx.callbackQuery);
        ctx.replyWithHTML(reply);
    }

    addPlayer = async (ctx: Ctx) => {
        const reply = await this.usecase.addPlayer(ctx.chat.id, ctx.from.id, String(ctx.message));
        ctx.replyWithHTML(reply);
    }

    startGame = async (ctx: Ctx | ActionCtx) => {
        const reply = await this.usecase.startGame(ctx.chat.id);
        replyWithHTMLByType(ctx, reply);
    }

    showPlayers = async (ctx: Ctx) => {
        const reply = await this.usecase.showPlayers(ctx.chat.id);
        replyWithHTMLByType(ctx, reply);
    }

    handleTeamWin = async (ctx: ActionCtx, team: 'first' | 'second') => {
        const reply = await this.usecase.handleTeamWin(ctx.chat.id, team);
        replyWithHTMLByType(ctx, reply);
    };

    replayHandler = async (ctx: ActionCtx) => {
        const reply = await this.usecase.replayHandler(ctx.chat.id, ctx.callbackQuery);
        replyWithHTMLByType(ctx, reply);
    }

    cancelGame = async (ctx: Ctx) => {
        const reply = await this.usecase.cancelCommand(ctx.chat.id);
        ctx.replyWithHTML(reply);
    }
}