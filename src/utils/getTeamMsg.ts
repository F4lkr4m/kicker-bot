export const getTeamMsg = (first: string, second?: string, isPvP?: boolean) => {
    const secondMsg = !second || isPvP ? '' : ` & \n${second}`;
    return `${first}${secondMsg}`;
}
