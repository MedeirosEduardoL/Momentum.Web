const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const dayFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

export function formatDate(isoDate: string) {
  return dateFormat.format(new Date(isoDate));
}

export function formatDay(isoDay: string) {
  return dayFormat.format(new Date(isoDay));
}
