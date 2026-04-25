import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { fromDateString } from "@/lib/dates";
import { isHM } from "@/lib/time-format";

const HM = z.string().refine(isHM, "Hora inválida (HH:mm)");

const itemSchema = z
  .object({
    userIds: z.array(z.string()).min(1),
    dates: z.array(z.string().length(10)).min(1),
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
    const body = itemSchema.parse(await req.json());

    if (
      body.breakType === "NONE" &&
      body.startTime &&
      body.endTime &&
      body.startTime === body.endTime
    ) {
      return fail("La hora de entrada y salida no pueden ser iguales.");
    }

    const isWorking = body.breakType === "NONE";
    const data = body.dates.flatMap((dateStr) =>
      body.userIds.map((userId) => ({
        userId,
        date: fromDateString(dateStr),
        startTime: isWorking ? body.startTime ?? null : null,
        endTime: isWorking ? body.endTime ?? null : null,
        lunchStart: isWorking ? body.lunchStart ?? null : null,
        lunchEnd: isWorking ? body.lunchEnd ?? null : null,
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
