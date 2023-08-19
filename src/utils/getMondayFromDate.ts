const SUNDAY = 0;


export const getMondayFromDate = (date: Date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day == SUNDAY ? -6 : 1);
  return new Date(date.setDate(diff));
}