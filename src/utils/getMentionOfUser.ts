export const getMentionOfUser = (id: number, name: string) => {
  return `<a href="tg://user?id=${id}">${name}</a>`;
};
