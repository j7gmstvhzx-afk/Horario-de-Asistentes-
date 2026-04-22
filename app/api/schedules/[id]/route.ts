import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const existing = await prisma.shift.findUnique({
      where: { id },
      include: { signature: true },
    });
    if (!existing) return fail("Turno no encontrado.", 404);
    if (existing.signature) {
      return fail("No se puede eliminar un turno ya firmado.", 409);
    }
    await prisma.shift.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
