import { headers } from "next/headers";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: { signature: true },
    });
    if (!shift) return fail("Turno no encontrado.", 404);
    if (shift.userId !== session.userId) {
      return fail("Solo puedes firmar tus propios turnos.", 403);
    }
    if (shift.signature) {
      return fail("Este turno ya está firmado.", 409);
    }

    const hdrs = await headers();
    const signature = await prisma.signature.create({
      data: {
        shiftId: id,
        userId: session.userId,
        ipAddress: hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? null,
        userAgent: hdrs.get("user-agent") ?? null,
      },
    });

    return ok(signature);
  } catch (err) {
    return handleError(err);
  }
}
