// Service worker for Web Push notifications.
// Casino Atlántico Manatí — Horario de Asistentes.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "Notificación", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Casino Atlántico Manatí";
  const options = {
    body: data.body || "",
    icon: "/logo-casino-atlantico.svg",
    badge: "/favicon.svg",
    tag: data.tag || "default",
    data: { url: data.url || "/" },
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((all) => {
      for (const client of all) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
