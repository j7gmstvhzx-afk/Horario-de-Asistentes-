import { z } from "zod";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9._-]+$/, {
      message: "Solo minúsculas, números, puntos, guiones y guión bajo.",
    }),
  fullName: z.string().min(2).max(120),
  password: z.string().min(8).max(200),
  position: z.enum(["SLOT_ATTENDANT", "SUPERVISOR"]),
  hourlyRate: z.number().min(0).max(1000),
  vacationHours: z.number().min(0).max(1000),
  sickHours: z.number().min(0).max(1000),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const existing = await prisma.user.findUnique({
      where: { username: body.username },
    });
    if (existing) return fail("Ese usuario ya existe.", 409);

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        username: body.username,
        fullName: body.fullName,
        passwordHash,
        position: body.position,
        hourlyRate: body.hourlyRate,
        vacationHours: body.vacationHours,
        sickHours: body.sickHours,
      },
    });
    return ok({ id: user.id }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
