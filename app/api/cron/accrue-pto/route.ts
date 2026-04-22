import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { MONTHLY_SICK_ACCRUAL, MONTHLY_VACATION_ACCRUAL } from "@/lib/pto";

function firstOfCurrentMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function runAccrual(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    // Vercel Cron sets `authorization: Bearer <CRON_SECRET>`; allow both styles.
    const bearer = req.headers.get("authorization");
    const custom = req.headers.get("x-cron-secret");
    const provided = bearer?.startsWith("Bearer ")
      ? bearer.slice(7)
      : custom ?? undefined;
    if (!cronSecret || !provided || provided !== cronSecret) {
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

export const GET = runAccrual;
export const POST = runAccrual;
