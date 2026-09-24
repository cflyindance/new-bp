import type { LocalBusinessDate } from "./demo-scenario-types";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseBusinessDate(value: LocalBusinessDate): Date {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid local business date: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Invalid local business date: ${value}`);
  }
  return date;
}

function formatBusinessDate(date: Date): LocalBusinessDate {
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as LocalBusinessDate;
}

export function addBusinessCalendarDays(value: LocalBusinessDate, days: number): LocalBusinessDate {
  if (!Number.isInteger(days)) throw new Error(`Calendar day offset must be an integer: ${days}`);
  const date = parseBusinessDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatBusinessDate(date);
}

export function buildBusinessDateWindow(anchorDate: LocalBusinessDate, days: number): LocalBusinessDate[] {
  if (!Number.isSafeInteger(days) || days <= 0) throw new Error(`Window days must be a positive integer: ${days}`);
  return Array.from({ length: days }, (_, index) => addBusinessCalendarDays(anchorDate, index - days + 1));
}

export function toLocalBusinessDate(date: Date): LocalBusinessDate {
  if (Number.isNaN(date.getTime())) throw new Error("Cannot format an invalid date");
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as LocalBusinessDate;
}
