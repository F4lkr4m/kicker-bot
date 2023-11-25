import { getRandomInt } from "./getRandomInt";

interface SelectedOthers<T> {
    selected: T[],
    others: T[],
}
  
export const selectOne = <T>({ selected, others }: SelectedOthers<T>): SelectedOthers<T> => {
    const randomIndex = getRandomInt(0, others.length);
    const newSelected = [...selected, others[randomIndex]];
    const newOthers = others.filter((_, index) => index !== randomIndex);
    return {
        selected: newSelected,
        others: newOthers
    };
};
  