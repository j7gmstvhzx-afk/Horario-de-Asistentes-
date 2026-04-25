import { describe, it, expect } from "vitest";
import { detectBreakConflicts, type ShiftWindow } from "@/lib/conflicts";

function mk(
  opts: Partial<ShiftWindow> & { id: string; userId: string },
): ShiftWindow {
  return {
    userName: opts.userId,
    date: new Date("2026-04-20T12:00:00"),
    lunchStart: null,
    lunchEnd: null,
    ...opts,
  };
}

describe("detectBreakConflicts", () => {
  it("does NOT alert on overlapping work windows when lunches don't overlap", () => {
    const conflicts = detectBreakConflicts([
      mk({ id: "1", userId: "a", lunchStart: "12:00", lunchEnd: "12:30" }),
      mk({ id: "2", userId: "b", lunchStart: "13:00", lunchEnd: "13:30" }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it("alerts on overlapping lunch windows", () => {
    const conflicts = detectBreakConflicts([
      mk({ id: "1", userId: "a", lunchStart: "12:00", lunchEnd: "12:30" }),
      mk({ id: "2", userId: "b", lunchStart: "12:15", lunchEnd: "12:45" }),
    ]);
    expect(conflicts).toHaveLength(1);
  });

  it("does not report if either shift has no lunch window", () => {
    const conflicts = detectBreakConflicts([
      mk({ id: "1", userId: "a", lunchStart: "12:00", lunchEnd: "12:30" }),
      mk({ id: "2", userId: "b" }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it("does not report same user", () => {
    const conflicts = detectBreakConflicts([
      mk({ id: "1", userId: "a", lunchStart: "12:00", lunchEnd: "12:30" }),
      mk({ id: "2", userId: "a", lunchStart: "12:15", lunchEnd: "12:45" }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it("does not report across different days", () => {
    const conflicts = detectBreakConflicts([
      mk({ id: "1", userId: "a", lunchStart: "12:00", lunchEnd: "12:30" }),
      mk({
        id: "2",
        userId: "b",
        date: new Date("2026-04-21T12:00:00"),
        lunchStart: "12:00",
        lunchEnd: "12:30",
      }),
    ]);
    expect(conflicts).toHaveLength(0);
  });
});
