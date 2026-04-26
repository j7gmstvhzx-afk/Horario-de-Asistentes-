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

/**
 * "Now" expressed as a Date whose local-style fields (getFullYear, getMonth,
 * getDate, getHours, ...) match the wall-clock time at the casino. Use this
 * instead of `new Date()` in every server-rendered page that asks "what day
 * is it" or "what week is this", to avoid the server's UTC clock leaking into
 * the rendered output (Vercel runs in UTC; PR is UTC-4).
 */
export function nowInCasino(): Date {
  // Format the actual instant in the Casino timezone, then parse those fields
  // back into a fresh Date with local-style getters.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CASINO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
}

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

/**
 * Format a Date as YYYY-MM-DD using local fields (no UTC shift).
 * Use this when passing dates server → client to avoid timezone drift.
 */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date at local noon (avoids DST / TZ issues).
 */
export function fromDateString(str: string): Date {
  return new Date(`${str}T12:00:00`);
}

export function formatMonthYear(date: Date): string {
  const month = format(date, "LLLL", { locale: es });
  const year = format(date, "yyyy");
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
}

export function formatDateShort(date: Date): string {
  return format(date, "dd-MMM-yy", { locale: es });
}

/** "lun, 20 abr 2026" */
export function formatDateWithYear(date: Date): string {
  const s = format(date, "EEE, d MMM yyyy", { locale: es });
  return s.replace(/^./, (c) => c.toUpperCase());
}

/** "lunes, 20 de abril 2026" */
export function formatDateLongWithYear(date: Date): string {
  const s = format(date, "EEEE, d 'de' MMMM yyyy", { locale: es });
  return s.replace(/^./, (c) => c.toUpperCase());
}

/** Range "Desde DD MMM YYYY hasta DD MMM YYYY" */
export function formatRangeDesdeHasta(start: Date, end: Date): string {
  return `Desde ${format(start, "d MMM yyyy", { locale: es })} hasta ${format(end, "d MMM yyyy", { locale: es })}`;
}

export function formatDateLong(date: Date): string {
  return format(date, "EEEE d 'de' MMMM, yyyy", { locale: es });
}

export function formatDateHeader(date: Date): string {
  // "Lun 20 Abr"
  const weekday = format(date, "EEEE", { locale: es });
  const short = format(date, "d MMM", { locale: es });
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1, 3);
  return `${cap} ${short}`;
}

export function formatWeekday(date: Date): string {
  const name = format(date, "EEEE", { locale: es });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatWeekdayShort(date: Date): string {
  const name = format(date, "EEE", { locale: es });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function isThisWeek(date: Date, now: Date = new Date()): boolean {
  return isSameWeek(date, now, { weekStartsOn: 1 });
}

export function isNextWeek(date: Date, now: Date = new Date()): boolean {
  return isSameWeek(date, addWeeks(now, 1), { weekStartsOn: 1 });
}
