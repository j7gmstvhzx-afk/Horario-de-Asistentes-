import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-z0-9._-]+$/),
  fullName: z.string().min(2).max(120),
  password: z.string().min(8).max(200),
});

/**
 * One-time bootstrap endpoint. Creates the first admin user only if there are
 * zero admins in the database. Protected by SETUP_TOKEN env var so it cannot
 * be called by anyone once deployed.
 */
export async function POST(req: Request) {
  try {
    const setupToken = process.env.SETUP_TOKEN;
    const provided = req.headers.get("x-setup-token");
    if (!setupToken || !provided || provided !== setupToken) {
      return fail("Setup token inválido.", 401);
    }

    const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (existingAdmin) {
      return fail(
        "Ya existe un administrador. Este endpoint solo funciona en la primera instalación.",
        409,
      );
    }

    const body = schema.parse(await req.json());
    const passwordHash = await hashPassword(body.password);
    const admin = await prisma.user.create({
      data: {
        username: body.username,
        fullName: body.fullName,
        passwordHash,
        role: "ADMIN",
        position: "SUPERVISOR",
        vacationHours: 120,
        sickHours: 80,
      },
    });

    return ok({ id: admin.id, username: admin.username });
  } catch (err) {
    return handleError(err);
  }
}
