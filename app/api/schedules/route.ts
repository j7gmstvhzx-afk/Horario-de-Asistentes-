import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { fromDateString } from "@/lib/dates";
import { isHM } from "@/lib/time-format";

const HM = z.string().refine(isHM, "Hora inválida (HH:mm)");

const schema = z
  .object({
    userId: z.string().min(1),
    date: z.string().length(10),
    startTime: HM.nullable().optional(),
    endTime: HM.nullable().optional(),
    lunchStart: HM.nullable().optional(),
    lunchEnd: HM.nullable().optional(),
    breakType: z
      .enum(["NONE", "VACATION", "SICK", "PERSONAL", "DAY_OFF"])
      .default("NONE"),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine(
    (v) =>
      v.breakType !== "NONE" || (Boolean(v.startTime) && Boolean(v.endTime)),
    {
      message: "Turno regular requiere hora de entrada y salida.",
      path: ["startTime"],
    },
  );

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());

    if (
      body.breakType === "NONE" &&
      body.startTime &&
      body.endTime &&
      body.startTime === body.endTime
    ) {
      return fail("La hora de entrada y salida no pueden ser iguales.");
    }

    const isWorking = body.breakType === "NONE";
    const shift = await prisma.shift.create({
      data: {
        userId: body.userId,
        date: fromDateString(body.date),
        startTime: isWorking ? body.startTime ?? null : null,
        endTime: isWorking ? body.endTime ?? null : null,
        lunchStart: isWorking ? body.lunchStart ?? null : null,
        lunchEnd: isWorking ? body.lunchEnd ?? null : null,
        breakType: body.breakType,
        notes: body.notes ?? null,
      },
    });

    return ok(shift, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
