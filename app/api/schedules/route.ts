import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  userId: z.string().min(1),
  date: z.string().min(8),
  startTime: z.string().min(10),
  endTime: z.string().min(10),
  lunchStart: z.string().nullable().optional(),
  lunchEnd: z.string().nullable().optional(),
  breakType: z.enum(["NONE", "VACATION", "SICK", "PERSONAL"]).default("NONE"),
  notes: z.string().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    if (Number.isNaN(startTime.valueOf()) || Number.isNaN(endTime.valueOf())) {
      return fail("Fechas inválidas.");
    }
    if (startTime >= endTime) {
      return fail("La hora de entrada debe ser anterior a la de salida.");
    }

    const lunchStart = body.lunchStart ? new Date(body.lunchStart) : null;
    const lunchEnd = body.lunchEnd ? new Date(body.lunchEnd) : null;
    if (lunchStart && lunchEnd && lunchStart >= lunchEnd) {
      return fail("El almuerzo debe empezar antes de terminar.");
    }

    const shift = await prisma.shift.create({
      data: {
        userId: body.userId,
        date: new Date(body.date),
        startTime,
        endTime,
        lunchStart,
        lunchEnd,
        breakType: body.breakType,
        notes: body.notes ?? null,
      },
    });

    return ok(shift, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
