import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { fromDateString } from "@/lib/dates";
import { isHM } from "@/lib/time-format";

const HM = z.string().refine(isHM, "Hora inválida (HH:mm)");

const itemSchema = z.object({
  userIds: z.array(z.string()).min(1),
  dates: z.array(z.string().length(10)).min(1),
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
    const body = itemSchema.parse(await req.json());

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

    const data = body.dates.flatMap((dateStr) =>
      body.userIds.map((userId) => ({
        userId,
        date: fromDateString(dateStr),
        startTime: body.startTime,
        endTime: body.endTime,
        lunchStart: body.lunchStart ?? null,
        lunchEnd: body.lunchEnd ?? null,
        breakType: body.breakType,
        notes: body.notes ?? null,
      })),
    );

    const result = await prisma.shift.createMany({ data });
    return ok({ created: result.count });
  } catch (err) {
    return handleError(err);
  }
}
