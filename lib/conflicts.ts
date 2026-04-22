export type ShiftWindow = {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  lunchStart: Date | null;
  lunchEnd: Date | null;
};

export type Conflict = {
  kind: "SHIFT" | "LUNCH";
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
 * Returns all pairs of shifts that collide either on their working window or
 * their lunch window. Used by the admin dashboard to surface duplicates.
 */
export function detectConflicts(shifts: readonly ShiftWindow[]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      const a = shifts[i];
      const b = shifts[j];
      if (!a || !b) continue;
      if (a.userId === b.userId) continue;
      if (!sameDay(a.date, b.date)) continue;

      if (overlaps(a.startTime, a.endTime, b.startTime, b.endTime)) {
        conflicts.push({
          kind: "SHIFT",
          date: a.date,
          a: { id: a.id, userName: a.userName },
          b: { id: b.id, userName: b.userName },
          message: `Turno solapado entre ${a.userName} y ${b.userName}`,
        });
      }

      if (
        a.lunchStart &&
        a.lunchEnd &&
        b.lunchStart &&
        b.lunchEnd &&
        overlaps(a.lunchStart, a.lunchEnd, b.lunchStart, b.lunchEnd)
      ) {
        conflicts.push({
          kind: "LUNCH",
          date: a.date,
          a: { id: a.id, userName: a.userName },
          b: { id: b.id, userName: b.userName },
          message: `Almuerzo solapado entre ${a.userName} y ${b.userName}`,
        });
      }
    }
  }
  return conflicts;
}
