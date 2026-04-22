import { describe, it, expect } from "vitest";
import { calculateTips } from "@/lib/tips";

// Based on the "Slot Attendant Tip Report 2026" Excel example:
//   7 employees, 40h each (total 280h)
//   Monday tips = $720, other days = $0 (total $720)
//   Rate per hour = $11.33
// Expected:
//   tipPerHour = 720 / 280 = 2.57 (rounded)
//   tipForEmployee = 40 * 2.57 = 102.86 (rounded from 102.8)
//   payPerHour = 11.33 + 2.57 = 13.90
//   totalComp = 40 * 13.90 = 556.00

describe("calculateTips", () => {
  const employees = [
    "Yadriel Rodriguez",
    "Paola Laureano",
    "Armando Meléndez",
    "Brian Larroy",
    "Bryan Loran",
    "Yandeliz Feliciano",
    "Josue Colón",
  ].map((name, i) => ({
    userId: `u${i}`,
    fullName: name,
    hours: {
      "2026-04-20": 8,
      "2026-04-21": 8,
      "2026-04-22": 8,
      "2026-04-23": 8,
      "2026-04-24": 8,
    },
  }));

  it("replicates the Excel totals", () => {
    const result = calculateTips({
      employees,
      dailyTips: { "2026-04-20": 720 },
      hourlyRate: 11.33,
    });

    expect(result.totalHoursWeek).toBe(280);
    expect(result.totalTipWeek).toBe(720);
    expect(result.tipPerHour).toBeCloseTo(2.57, 2);
    expect(result.payPerHour).toBeCloseTo(13.9, 2);
    expect(result.perEmployee).toHaveLength(7);
    for (const emp of result.perEmployee) {
      expect(emp.hoursWorked).toBe(40);
      expect(emp.tipEarned).toBeCloseTo(102.8, 1);
      expect(emp.totalComp).toBeCloseTo(556, 0);
    }
  });

  it("returns zero when there are no hours", () => {
    const result = calculateTips({
      employees: [],
      dailyTips: {},
      hourlyRate: 10,
    });
    expect(result.totalHoursWeek).toBe(0);
    expect(result.tipPerHour).toBe(0);
    expect(result.payPerHour).toBe(10);
  });

  it("distributes tips proportionally to hours", () => {
    const result = calculateTips({
      employees: [
        { userId: "a", fullName: "A", hours: { "2026-04-20": 10 } },
        { userId: "b", fullName: "B", hours: { "2026-04-20": 30 } },
      ],
      dailyTips: { "2026-04-20": 400 },
      hourlyRate: 0,
    });
    expect(result.totalHoursWeek).toBe(40);
    expect(result.tipPerHour).toBe(10);
    expect(result.perEmployee.find((e) => e.userId === "a")?.tipEarned).toBe(100);
    expect(result.perEmployee.find((e) => e.userId === "b")?.tipEarned).toBe(300);
  });
});
