import webpush from "web-push";
import { prisma } from "@/lib/db";

let configured = false;
function configure() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@horarioasistentes.app";
  if (!pub || !priv) return; // Not configured yet — silently skip.
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string; // e.g. "/employee/schedule"
  tag?: string;
};

/** Send a push to every device subscribed for the user. */
export async function sendToUser(userId: string, payload: PushPayload) {
  configure();
  if (!configured) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        // Subscription expired / gone → remove.
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}

/** Send to every user that matches a role. Useful for admin/manager fan-out. */
export async function sendToRoles(
  roles: ("ADMIN" | "EMPLOYEE")[],
  payload: PushPayload,
) {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: roles } },
    select: { id: true },
  });
  await Promise.all(users.map((u) => sendToUser(u.id, payload)));
}
