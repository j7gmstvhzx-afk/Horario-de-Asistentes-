import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  vacationHours: z.number().min(0).max(1000).optional(),
  sickHours: z.number().min(0).max(1000).optional(),
  hourlyRate: z.number().min(0).max(1000).optional(),
  active: z.boolean().optional(),
  reason: z.string().max(200).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return fail("Empleado no encontrado.", 404);

    const vacationDelta =
      body.vacationHours !== undefined
        ? body.vacationHours - Number(user.vacationHours)
        : 0;
    const sickDelta =
      body.sickHours !== undefined
        ? body.sickHours - Number(user.sickHours)
        : 0;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          vacationHours: body.vacationHours,
          sickHours: body.sickHours,
          hourlyRate: body.hourlyRate,
          active: body.active,
        },
      });

      if (vacationDelta !== 0 || sickDelta !== 0) {
        await tx.balanceEdit.create({
          data: {
            userId: id,
            adminId: admin.userId,
            vacationDelta,
            sickDelta,
            reason: body.reason ?? null,
          },
        });
      }
    });

    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}
