import { z } from "zod";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  password: z.string().min(8).max(200),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return fail("Empleado no encontrado.", 404);

    const passwordHash = await hashPassword(body.password);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}
