import { z } from "zod";
import { headers } from "next/headers";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = schema.parse(await req.json());
    const ua = (await headers()).get("user-agent") ?? null;

    await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: {
        userId: session.userId,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: ua,
      },
      create: {
        userId: session.userId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userAgent: ua,
      },
    });
    return ok({ saved: true });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireSession();
    const { endpoint } = await req.json();
    if (typeof endpoint === "string") {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
    return ok({ removed: true });
  } catch (err) {
    return handleError(err);
  }
}
