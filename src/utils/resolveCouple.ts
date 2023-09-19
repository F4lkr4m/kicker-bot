import {Couple} from "../db/Room/types";


export const resolveCouple = (ids: number[]): Couple => {
    return [
        ids[0],
        ...(!ids[1] ? [] : [ids[1]]) as [number?]
    ]
}
