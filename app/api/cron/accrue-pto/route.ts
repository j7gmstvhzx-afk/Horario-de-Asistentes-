import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { MONTHLY_SICK_ACCRUAL, MONTHLY_VACATION_ACCRUAL } from "@/lib/pto";

function firstOfCurrentMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-cron-secret");
    if (!secret || secret !== process.env.CRON_SECRET) {
      return fail("Invalid secret", 401);
    }

    const month = firstOfCurrentMonthUTC();
    const employees = await prisma.user.findMany({
      where: { active: true, role: "EMPLOYEE" },
      select: { id: true },
    });

    let accrued = 0;
    for (const emp of employees) {
      const existing = await prisma.ptoAccrualLog.findUnique({
        where: { userId_month: { userId: emp.id, month } },
      });
      if (existing) continue;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: emp.id },
          data: {
            vacationHours: { increment: MONTHLY_VACATION_ACCRUAL },
            sickHours: { increment: MONTHLY_SICK_ACCRUAL },
          },
        }),
        prisma.ptoAccrualLog.create({
          data: {
            userId: emp.id,
            month,
            vacationAdded: MONTHLY_VACATION_ACCRUAL,
            sickAdded: MONTHLY_SICK_ACCRUAL,
          },
        }),
      ]);
      accrued += 1;
    }

    return ok({ month: month.toISOString(), accrued });
  } catch (err) {
    return handleError(err);
  }
}
