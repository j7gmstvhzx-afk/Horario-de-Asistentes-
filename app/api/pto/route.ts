import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { canDeduct } from "@/lib/pto";

const schema = z.object({
  type: z.enum(["VACATION", "SICK"]),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  hours: z.number().positive().max(500),
  reason: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await req.json());

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      return fail("Fechas inválidas.");
    }
    if (start > end) return fail("La fecha 'Hasta' debe ser posterior a 'Desde'.");

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { vacationHours: true, sickHours: true },
    });

    const check = canDeduct(
      {
        vacationHours: Number(user.vacationHours),
        sickHours: Number(user.sickHours),
      },
      body.type,
      body.hours,
    );
    if (!check.ok) return fail(check.reason, 422);

    const request = await prisma.ptoRequest.create({
      data: {
        userId: session.userId,
        type: body.type,
        startDate: start,
        endDate: end,
        hours: body.hours,
        reason: body.reason ?? null,
      },
    });
    return ok(request, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
