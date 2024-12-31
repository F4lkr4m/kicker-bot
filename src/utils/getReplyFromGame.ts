import { RoomsRepo } from "@/db/Room";
import {Repo} from "../db";
import {Couple} from "../db/Room/types";
import {getMentionOfUser} from "./getMentionOfUser";
import {getTeamMsg} from "./getTeamMsg";
import { UserRepo } from "@/db/Users";


export const getReplyFromGame = async (roomRepo: RoomsRepo, userRepo: UserRepo, chatId: number, firstCouple: Couple, secondCouple: Couple) => {
    await roomRepo.setFirstPair(chatId, firstCouple);
    await roomRepo.setSecondPair(chatId, secondCouple);
    await roomRepo.updateRoomState(chatId, 'PLAYING');

    const first = await userRepo.getUser(firstCouple[0]);
    const second = firstCouple[1]
        ? await userRepo.getUser(firstCouple[1])
        : undefined;
    const third = await userRepo.getUser(secondCouple[0]);
    const fourth = secondCouple[1]
        ? await userRepo.getUser(secondCouple[1])
        : undefined;

    const firstCoupleMsg = !second?.id
        ? `Первый игрок: ${getMentionOfUser(first.id, first.name)}`
        : `Первая команда: ${getMentionOfUser(first.id, first.name)} & ${getMentionOfUser(second?.id, second?.name)}`;
    const secondCoupleMsg = !fourth?.id
        ? `Второй игрок: ${getMentionOfUser(third.id, third.name)}`
        : `Вторая команда: ${getMentionOfUser(third.id, third.name)} & ${getMentionOfUser(fourth?.id, fourth?.name)}`

    const reply = `Играют:
    ${firstCoupleMsg}
    ${secondCoupleMsg}\nКто победил?
    `

    return {
        reply,
        replyOptions: {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: getTeamMsg(first.name, second?.name),
                            callback_data: "first team win"
                        },
                    ],
                    [
                        {
                            text: getTeamMsg(third.name, fourth?.name),
                            callback_data: "second team win"
                        },
                    ]
                ]
            }
        }
    }
}
