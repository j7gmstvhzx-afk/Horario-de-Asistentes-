import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { fromDateString, formatDateLongWithYear } from "@/lib/dates";
import { isHM, formatRangeHM12, breakTypeLabel } from "@/lib/time-format";
import { sendToUser } from "@/lib/push";

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

    // Fan-out one notification per affected employee. Group dates so each user
    // gets a single push describing how many turnos they got.
    for (const userId of body.userIds) {
      const datesForUser = body.dates.map((d) => formatDateLongWithYear(fromDateString(d)));
      const summary =
        datesForUser.length === 1
          ? datesForUser[0]
          : `${datesForUser.length} días · ${datesForUser[0]}…`;
      const detail = isWorking
        ? formatRangeHM12(body.startTime ?? null, body.endTime ?? null)
        : breakTypeLabel(body.breakType);
      sendToUser(userId, {
        title: "Nuevos turnos asignados",
        body: `${summary} · ${detail}`,
        url: "/employee/schedule",
        tag: `shift-batch-${userId}-${Date.now()}`,
      }).catch(() => {});
    }

    return ok({ created: result.count });
  } catch (err) {
    return handleError(err);
  }
}
