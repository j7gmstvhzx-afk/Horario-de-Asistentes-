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
  it("does NOT alert when two employees work overlapping shifts without lunch overlap", () => {
    // Two employees both working 8am-4pm simultaneously — totally fine.
    const conflicts = detectBreakConflicts([
      mk({
        id: "1",
        userId: "a",
        lunchStart: new Date("2026-04-20T12:00:00"),
        lunchEnd: new Date("2026-04-20T12:30:00"),
      }),
      mk({
        id: "2",
        userId: "b",
        lunchStart: new Date("2026-04-20T13:00:00"),
        lunchEnd: new Date("2026-04-20T13:30:00"),
      }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it("alerts when two employees have overlapping lunch windows", () => {
    const conflicts = detectBreakConflicts([
      mk({
        id: "1",
        userId: "a",
        lunchStart: new Date("2026-04-20T12:00:00"),
        lunchEnd: new Date("2026-04-20T12:30:00"),
      }),
      mk({
        id: "2",
        userId: "b",
        lunchStart: new Date("2026-04-20T12:15:00"),
        lunchEnd: new Date("2026-04-20T12:45:00"),
      }),
    ]);
    expect(conflicts).toHaveLength(1);
  });

  it("does not report if either shift has no lunch window", () => {
    const conflicts = detectBreakConflicts([
      mk({
        id: "1",
        userId: "a",
        lunchStart: new Date("2026-04-20T12:00:00"),
        lunchEnd: new Date("2026-04-20T12:30:00"),
      }),
      mk({
        id: "2",
        userId: "b",
        lunchStart: null,
        lunchEnd: null,
      }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it("does not report same user", () => {
    const conflicts = detectBreakConflicts([
      mk({
        id: "1",
        userId: "a",
        lunchStart: new Date("2026-04-20T12:00:00"),
        lunchEnd: new Date("2026-04-20T12:30:00"),
      }),
      mk({
        id: "2",
        userId: "a",
        lunchStart: new Date("2026-04-20T12:15:00"),
        lunchEnd: new Date("2026-04-20T12:45:00"),
      }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it("does not report across different days", () => {
    const conflicts = detectBreakConflicts([
      mk({
        id: "1",
        userId: "a",
        lunchStart: new Date("2026-04-20T12:00:00"),
        lunchEnd: new Date("2026-04-20T12:30:00"),
      }),
      mk({
        id: "2",
        userId: "b",
        date: new Date("2026-04-21T12:00:00"),
        lunchStart: new Date("2026-04-21T12:00:00"),
        lunchEnd: new Date("2026-04-21T12:30:00"),
      }),
    ]);
    expect(conflicts).toHaveLength(0);
  });
});
