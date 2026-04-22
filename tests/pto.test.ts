import { describe, it, expect } from "vitest";
import { applyAccrual, canDeduct, deduct } from "@/lib/pto";

describe("applyAccrual", () => {
  it("adds 10h vacation and 8h sick per month", () => {
    const next = applyAccrual({ vacationHours: 5, sickHours: 2 });
    expect(next.vacationHours).toBe(15);
    expect(next.sickHours).toBe(10);
  });
});

describe("canDeduct", () => {
  const balance = { vacationHours: 40, sickHours: 16 };

  it("allows deduction within balance", () => {
    expect(canDeduct(balance, "VACATION", 8).ok).toBe(true);
    expect(canDeduct(balance, "SICK", 8).ok).toBe(true);
  });

  it("rejects deduction exceeding balance", () => {
    const r = canDeduct(balance, "SICK", 24);
    expect(r.ok).toBe(false);
  });

  it("rejects zero or negative hours", () => {
    expect(canDeduct(balance, "VACATION", 0).ok).toBe(false);
    expect(canDeduct(balance, "VACATION", -5).ok).toBe(false);
  });
});

describe("deduct", () => {
  it("removes hours from the correct bucket", () => {
    const balance = { vacationHours: 40, sickHours: 16 };
    expect(deduct(balance, "VACATION", 8).vacationHours).toBe(32);
    expect(deduct(balance, "SICK", 4).sickHours).toBe(12);
  });
});
