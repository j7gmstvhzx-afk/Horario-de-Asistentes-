import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { fromDateString } from "@/lib/dates";

const itemSchema = z.object({
  userIds: z.array(z.string()).min(1),
  dates: z.array(z.string().length(10)).min(1), // YYYY-MM-DD
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  lunchStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  lunchEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  breakType: z.enum(["NONE", "VACATION", "SICK", "PERSONAL"]).default("NONE"),
  notes: z.string().max(500).optional().nullable(),
});

function combine(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = itemSchema.parse(await req.json());

    // Validate time sanity.
    if (body.startTime >= body.endTime) {
      return fail("La hora de entrada debe ser anterior a la de salida.");
    }
    if (
      body.lunchStart &&
      body.lunchEnd &&
      body.lunchStart >= body.lunchEnd
    ) {
      return fail("El break debe empezar antes de terminar.");
    }

    const data = body.dates.flatMap((dateStr) =>
      body.userIds.map((userId) => ({
        userId,
        date: fromDateString(dateStr),
        startTime: combine(dateStr, body.startTime),
        endTime: combine(dateStr, body.endTime),
        lunchStart: body.lunchStart ? combine(dateStr, body.lunchStart) : null,
        lunchEnd: body.lunchEnd ? combine(dateStr, body.lunchEnd) : null,
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
