import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { isHM, toMinutes } from "@/lib/time-format";
import { fromDateString } from "@/lib/dates";

const HM = z.string().refine(isHM, "Hora inválida (HH:mm)");

const schema = z.object({
  shiftId: z.string().min(1),
  status: z.enum(["ON_TIME", "LATE", "ABSENT", "EXCUSED"]),
  clockIn: HM.nullable().optional(),
  clockOut: HM.nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await req.json());

    const shift = await prisma.shift.findUnique({
      where: { id: body.shiftId },
    });
    if (!shift) return fail("Turno no encontrado.", 404);
    if (shift.breakType !== "NONE") {
      return fail(
        "Este turno no requiere asistencia (vacaciones / día libre / enfermedad).",
        409,
      );
    }

    // Compute minutes late: positive if clockIn is after scheduled startTime.
    let minutesLate = 0;
    if (body.status === "LATE" && body.clockIn && shift.startTime) {
      minutesLate = Math.max(
        0,
        toMinutes(body.clockIn) - toMinutes(shift.startTime),
      );
    }

    const dateStr = shift.date.toISOString().slice(0, 10);
    const dayDate = fromDateString(dateStr);

    // Build full timestamps for clockIn/clockOut anchored to the shift's date.
    const clockInDate = body.clockIn
      ? new Date(`${dateStr}T${body.clockIn}:00`)
      : null;
    const clockOutDate = body.clockOut
      ? new Date(`${dateStr}T${body.clockOut}:00`)
      : null;

    const att = await prisma.attendance.upsert({
      where: { shiftId: body.shiftId },
      create: {
        shiftId: body.shiftId,
        userId: shift.userId,
        date: dayDate,
        clockIn: clockInDate,
        clockOut: clockOutDate,
        status: body.status,
        minutesLate,
        notes: body.notes ?? null,
        recordedBy: admin.userId,
      },
      update: {
        clockIn: clockInDate,
        clockOut: clockOutDate,
        status: body.status,
        minutesLate,
        notes: body.notes ?? null,
        recordedBy: admin.userId,
      },
    });

    return ok(att);
  } catch (err) {
    return handleError(err);
  }
}
