/**
 * Break conflict detection. In a casino, multiple employees working same
 * shift is fine; ONLY overlapping breaks need to alert.
 *
 * Times are HH:mm strings (Casino local). End may be < start when crossing
 * midnight; helpers in lib/time-format handle that.
 */
import { rangesOverlapHM } from "./time-format";

export type ShiftWindow = {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  lunchStart: string | null;
  lunchEnd: string | null;
};

export type BreakConflict = {
  date: Date;
  a: { id: string; userName: string };
  b: { id: string; userName: string };
  message: string;
};

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function detectBreakConflicts(
  shifts: readonly ShiftWindow[],
): BreakConflict[] {
  const conflicts: BreakConflict[] = [];
  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      const a = shifts[i];
      const b = shifts[j];
      if (!a || !b) continue;
      if (a.userId === b.userId) continue;
      if (!sameDay(a.date, b.date)) continue;
      if (!a.lunchStart || !a.lunchEnd || !b.lunchStart || !b.lunchEnd) continue;

      if (rangesOverlapHM(a.lunchStart, a.lunchEnd, b.lunchStart, b.lunchEnd)) {
        conflicts.push({
          date: a.date,
          a: { id: a.id, userName: a.userName },
          b: { id: b.id, userName: b.userName },
          message: `Break solapado entre ${a.userName} y ${b.userName}`,
        });
      }
    }
  }
  return conflicts;
}
