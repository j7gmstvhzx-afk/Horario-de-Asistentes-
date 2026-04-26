import { z } from "zod";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { canDeduct } from "@/lib/pto";
import { sendToUser } from "@/lib/push";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const request = await prisma.ptoRequest.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!request) return fail("Solicitud no encontrada.", 404);
    if (request.status !== "PENDING") {
      return fail("La solicitud ya fue procesada.", 409);
    }

    if (body.status === "APPROVED") {
      const check = canDeduct(
        {
          vacationHours: Number(request.user.vacationHours),
          sickHours: Number(request.user.sickHours),
        },
        request.type,
        Number(request.hours),
      );
      if (!check.ok) return fail(check.reason, 422);

      await prisma.$transaction([
        prisma.ptoRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            reviewedBy: admin.userId,
            reviewedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: request.userId },
          data:
            request.type === "VACATION"
              ? { vacationHours: { decrement: request.hours } }
              : { sickHours: { decrement: request.hours } },
        }),
      ]);
    } else {
      await prisma.ptoRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedBy: admin.userId,
          reviewedAt: new Date(),
        },
      });
    }

    sendToUser(request.userId, {
      title:
        body.status === "APPROVED"
          ? "Solicitud PTO aprobada ✓"
          : "Solicitud PTO rechazada",
      body: `${request.type === "VACATION" ? "Vacaciones" : "Enfermedad"} · ${Number(request.hours)}h`,
      url: "/employee/requests",
      tag: `pto-decision-${request.id}`,
    }).catch(() => {});

    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const request = await prisma.ptoRequest.findUnique({ where: { id } });
    if (!request) return fail("Solicitud no encontrada.", 404);
    if (request.userId !== session.userId) {
      return fail("Solo puedes cancelar tus propias solicitudes.", 403);
    }
    if (request.status !== "PENDING") {
      return fail("Solo se pueden cancelar solicitudes pendientes.", 409);
    }
    await prisma.ptoRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return ok({ cancelled: true });
  } catch (err) {
    return handleError(err);
  }
}
