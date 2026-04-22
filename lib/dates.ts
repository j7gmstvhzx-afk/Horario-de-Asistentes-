import {
  addDays,
  endOfWeek,
  format,
  startOfWeek,
  isSameWeek,
  addWeeks,
} from "date-fns";
import { es } from "date-fns/locale";

export const CASINO_TIMEZONE =
  process.env.NEXT_PUBLIC_TIMEZONE ?? "America/Puerto_Rico";

// Work weeks start on Monday (ISO).
export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function weekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function weekDays(date: Date): Date[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatMonthYear(date: Date): string {
  const month = format(date, "LLLL", { locale: es });
  const year = format(date, "yyyy");
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
}

export function formatDateShort(date: Date): string {
  return format(date, "dd-MMM-yy", { locale: es });
}

export function formatWeekday(date: Date): string {
  const name = format(date, "EEEE", { locale: es });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function isThisWeek(date: Date, now: Date = new Date()): boolean {
  return isSameWeek(date, now, { weekStartsOn: 1 });
}

export function isNextWeek(date: Date, now: Date = new Date()): boolean {
  return isSameWeek(date, addWeeks(now, 1), { weekStartsOn: 1 });
}
