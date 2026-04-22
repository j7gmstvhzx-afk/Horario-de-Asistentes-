/**
 * Time formatting utilities — everything uses 12-hour format with AM/PM.
 */

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\s(AM|PM)$/, " $1");
}

export function formatTimeRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): string {
  if (!start || !end) return "—";
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/**
 * Parse "HH:mm" (24h) from a native <input type="time"> into an ISO string on a
 * given YYYY-MM-DD date. Returns local time; used in forms where the admin
 * types into a time input.
 */
export function combineDateTime(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00`;
}
