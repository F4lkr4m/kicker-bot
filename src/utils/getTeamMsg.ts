export const getTeamMsg = (first: string, second?: string, isPvP?: boolean) => {
    const secondMsg = !second || isPvP ? '' : ` & ${second}`;
    return `${first}${secondMsg}`;
}
