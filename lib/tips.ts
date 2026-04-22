export type HoursByDay = Record<string, number>; // ISO date (yyyy-MM-dd) -> hours
export type DailyTipTotals = Record<string, number>; // ISO date -> total tip amount

export type EmployeeRow = {
  userId: string;
  fullName: string;
  hours: HoursByDay;
};

export type TipCalculation = {
  totalHoursWeek: number;
  totalTipWeek: number;
  tipPerHour: number;
  payPerHour: number; // hourlyRate + tipPerHour
  perEmployee: {
    userId: string;
    fullName: string;
    hoursWorked: number;
    tipEarned: number;
    totalComp: number;
  }[];
};

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function sum(values: number[]): number {
  return values.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
}

/**
 * Replicates the "Slot Attendant Tip Report 2026" Excel formulas:
 *   tipPerHour    = totalTipWeek / totalHoursWeek
 *   tipForEmp     = employeeHours * tipPerHour
 *   payPerHour    = hourlyRate + tipPerHour
 *   totalComp     = employeeHours * payPerHour
 */
export function calculateTips(args: {
  employees: readonly EmployeeRow[];
  dailyTips: DailyTipTotals;
  hourlyRate: number;
}): TipCalculation {
  const { employees, dailyTips, hourlyRate } = args;

  const totalTipWeek = round2(sum(Object.values(dailyTips)));
  const totalHoursWeek = round2(
    sum(employees.flatMap((e) => Object.values(e.hours))),
  );

  const tipPerHour =
    totalHoursWeek > 0 ? round2(totalTipWeek / totalHoursWeek) : 0;
  const payPerHour = round2(hourlyRate + tipPerHour);

  const perEmployee = employees.map((e) => {
    const hoursWorked = round2(sum(Object.values(e.hours)));
    const tipEarned = round2(hoursWorked * tipPerHour);
    const totalComp = round2(hoursWorked * payPerHour);
    return {
      userId: e.userId,
      fullName: e.fullName,
      hoursWorked,
      tipEarned,
      totalComp,
    };
  });

  return {
    totalHoursWeek,
    totalTipWeek,
    tipPerHour,
    payPerHour,
    perEmployee,
  };
}
