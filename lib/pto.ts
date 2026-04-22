import type { PtoType } from "@prisma/client";

export const MONTHLY_VACATION_ACCRUAL = 10;
export const MONTHLY_SICK_ACCRUAL = 8;

export type Balance = {
  vacationHours: number;
  sickHours: number;
};

export function applyAccrual(balance: Balance): Balance {
  return {
    vacationHours: balance.vacationHours + MONTHLY_VACATION_ACCRUAL,
    sickHours: balance.sickHours + MONTHLY_SICK_ACCRUAL,
  };
}

export function canDeduct(
  balance: Balance,
  type: PtoType,
  hours: number,
): { ok: true } | { ok: false; reason: string } {
  if (hours <= 0) {
    return { ok: false, reason: "Las horas deben ser mayores a cero." };
  }
  if (type === "VACATION" && balance.vacationHours < hours) {
    return {
      ok: false,
      reason: `Balance insuficiente de vacaciones (${balance.vacationHours}h disponibles, ${hours}h solicitadas).`,
    };
  }
  if (type === "SICK" && balance.sickHours < hours) {
    return {
      ok: false,
      reason: `Balance insuficiente de enfermedad (${balance.sickHours}h disponibles, ${hours}h solicitadas).`,
    };
  }
  return { ok: true };
}

export function deduct(
  balance: Balance,
  type: PtoType,
  hours: number,
): Balance {
  if (type === "VACATION") {
    return { ...balance, vacationHours: balance.vacationHours - hours };
  }
  return { ...balance, sickHours: balance.sickHours - hours };
}
