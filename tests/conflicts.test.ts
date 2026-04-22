import { describe, it, expect } from "vitest";
import { detectConflicts, type ShiftWindow } from "@/lib/conflicts";

function mk(opts: Partial<ShiftWindow> & { id: string; userId: string }): ShiftWindow {
  return {
    userName: opts.userId,
    date: new Date("2026-04-20T00:00:00Z"),
    startTime: new Date("2026-04-20T08:00:00Z"),
    endTime: new Date("2026-04-20T16:00:00Z"),
    lunchStart: null,
    lunchEnd: null,
    ...opts,
  };
}

describe("detectConflicts", () => {
  it("returns empty when no overlap", () => {
    const conflicts = detectConflicts([
      mk({ id: "1", userId: "a" }),
      mk({
        id: "2",
        userId: "b",
        startTime: new Date("2026-04-20T16:00:00Z"),
        endTime: new Date("2026-04-21T00:00:00Z"),
      }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it("detects overlapping shifts on the same day", () => {
    const conflicts = detectConflicts([
      mk({ id: "1", userId: "a" }),
      mk({
        id: "2",
        userId: "b",
        startTime: new Date("2026-04-20T10:00:00Z"),
        endTime: new Date("2026-04-20T18:00:00Z"),
      }),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.kind).toBe("SHIFT");
  });

  it("detects overlapping lunch windows", () => {
    const conflicts = detectConflicts([
      mk({
        id: "1",
        userId: "a",
        lunchStart: new Date("2026-04-20T12:00:00Z"),
        lunchEnd: new Date("2026-04-20T13:00:00Z"),
      }),
      mk({
        id: "2",
        userId: "b",
        startTime: new Date("2026-04-20T10:00:00Z"),
        endTime: new Date("2026-04-20T18:00:00Z"),
        lunchStart: new Date("2026-04-20T12:30:00Z"),
        lunchEnd: new Date("2026-04-20T13:30:00Z"),
      }),
    ]);
    // 1 shift conflict + 1 lunch conflict
    expect(conflicts.some((c) => c.kind === "LUNCH")).toBe(true);
  });

  it("does not report the same user colliding with themselves", () => {
    const conflicts = detectConflicts([
      mk({ id: "1", userId: "a" }),
      mk({ id: "2", userId: "a" }),
    ]);
    expect(conflicts).toHaveLength(0);
  });

  it("does not report conflicts across different days", () => {
    const conflicts = detectConflicts([
      mk({ id: "1", userId: "a" }),
      mk({
        id: "2",
        userId: "b",
        date: new Date("2026-04-21T00:00:00Z"),
        startTime: new Date("2026-04-21T08:00:00Z"),
        endTime: new Date("2026-04-21T16:00:00Z"),
      }),
    ]);
    expect(conflicts).toHaveLength(0);
  });
});
