/**
 * Time helpers — all times are stored & manipulated as "HH:mm" 24h strings
 * (Casino local time). No JS Date involved => no timezone drift.
 */

const HM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isHM(value: string): boolean {
  return HM_RE.test(value);
}

export function parseHM(value: string): { h: number; m: number } | null {
  const match = HM_RE.exec(value);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

export function toMinutes(value: string): number {
  const p = parseHM(value);
  if (!p) return 0;
  return p.h * 60 + p.m;
}

export function fromMinutes(total: number): string {
  // Wrap into 0..1439 (24h).
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutesHM(value: string, minutes: number): string {
  return fromMinutes(toMinutes(value) + minutes);
}

/** Duration in minutes from start to end. If end < start, crosses midnight. */
export function durationMinutes(start: string, end: string): number {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return e >= s ? e - s : 1440 - s + e;
}

/** Format "HH:mm" 24h → "h:mm AM/PM". */
export function formatHM12(value: string | null | undefined): string {
  if (!value) return "—";
  const p = parseHM(value);
  if (!p) return "—";
  const period = p.h >= 12 ? "PM" : "AM";
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${h12}:${String(p.m).padStart(2, "0")} ${period}`;
}

export function formatRangeHM12(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start || !end) return "—";
  return `${formatHM12(start)} – ${formatHM12(end)}`;
}

/** True if the two HH:mm windows overlap (treating the second as next-day if end < start). */
export function rangesOverlapHM(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  // Convert to minute ranges, allowing end > 1440 when crossing midnight.
  const aS = toMinutes(aStart);
  const aE = aS + durationMinutes(aStart, aEnd);
  const bS = toMinutes(bStart);
  const bE = bS + durationMinutes(bStart, bEnd);
  return aS < bE && bS < aE;
}
