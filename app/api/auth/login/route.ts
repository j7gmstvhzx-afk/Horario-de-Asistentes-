import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { username: body.username.toLowerCase() },
    });
    if (!user || !user.active) return fail("Credenciales inválidas", 401);

    const match = await verifyPassword(body.password, user.passwordHash);
    if (!match) return fail("Credenciales inválidas", 401);

    await setSessionCookie({
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    });

    return ok({ role: user.role });
  } catch (err) {
    return handleError(err);
  }
}
