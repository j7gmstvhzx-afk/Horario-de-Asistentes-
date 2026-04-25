import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { fromDateString } from "@/lib/dates";
import { isHM } from "@/lib/time-format";

const HM = z.string().refine(isHM, "Hora inválida (HH:mm)");

const schema = z.object({
  userId: z.string().min(1),
  date: z.string().length(10),
  startTime: HM,
  endTime: HM,
  lunchStart: HM.nullable().optional(),
  lunchEnd: HM.nullable().optional(),
  breakType: z.enum(["NONE", "VACATION", "SICK", "PERSONAL"]).default("NONE"),
  notes: z.string().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());

    if (body.startTime === body.endTime) {
      return fail("La hora de entrada y salida no pueden ser iguales.");
    }
    if (
      body.lunchStart &&
      body.lunchEnd &&
      body.lunchStart === body.lunchEnd
    ) {
      return fail("El break no puede tener duración cero.");
    }

    const shift = await prisma.shift.create({
      data: {
        userId: body.userId,
        date: fromDateString(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        lunchStart: body.lunchStart ?? null,
        lunchEnd: body.lunchEnd ?? null,
        breakType: body.breakType,
        notes: body.notes ?? null,
      },
    });

    return ok(shift, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
