/**
 * Conflict detection for schedules.
 *
 * IMPORTANT: In a casino, multiple employees working at the same time is
 * normal and expected. The ONLY real conflict is when two employees take
 * their break/lunch at the same time, because the floor cannot be unattended.
 *
 * So we ONLY detect overlap on lunch windows. Shift windows are not checked.
 */

export type ShiftWindow = {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  lunchStart: Date | null;
  lunchEnd: Date | null;
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

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Returns pairs of shifts whose break/lunch windows overlap on the same day.
 * Shifts without a defined lunch window are skipped.
 */
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

      if (overlaps(a.lunchStart, a.lunchEnd, b.lunchStart, b.lunchEnd)) {
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
