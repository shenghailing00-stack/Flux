const DAY_MS = 24 * 60 * 60 * 1000;

export function todayIso() {
  return toIso(new Date());
}

export function toIso(date: Date) {
  return formatLocalDate(date);
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIso(iso: string) {
  return parseLocalDate(iso);
}

export function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(iso: string, days: number) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function diffDays(fromIso: string, toIsoDate: string) {
  return Math.round((parseIso(toIsoDate).getTime() - parseIso(fromIso).getTime()) / DAY_MS);
}

export function daysInclusive(startIso: string, endIso: string) {
  return diffDays(startIso, endIso) + 1;
}

export function isBetween(date: string, start: string, end: string) {
  return isDateInRange(date, start, end);
}

export function isSameDate(a: string | Date, b: string | Date) {
  const dateA = typeof a === "string" ? parseLocalDate(a) : a;
  const dateB = typeof b === "string" ? parseLocalDate(b) : b;
  return formatLocalDate(dateA) === formatLocalDate(dateB);
}

export function isDateInRange(date: string | Date, startDate: string | Date, endDate: string | Date) {
  const target = typeof date === "string" ? formatLocalDate(parseLocalDate(date)) : formatLocalDate(date);
  const start = typeof startDate === "string" ? formatLocalDate(parseLocalDate(startDate)) : formatLocalDate(startDate);
  const end = typeof endDate === "string" ? formatLocalDate(parseLocalDate(endDate)) : formatLocalDate(endDate);
  return target >= start && target <= end;
}

export function formatZhDate(iso: string | null) {
  if (!iso) return "暂无";
  const date = parseIso(iso);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function getMonthDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}
