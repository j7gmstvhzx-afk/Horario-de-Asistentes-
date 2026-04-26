"use client";

import { Bell, BellOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const DISMISS_KEY = "push-prompt-dismissed-v1";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

async function subscribe(): Promise<boolean> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    toast.error("Tu navegador no soporta notificaciones.");
    return false;
  }
  if (!VAPID_PUBLIC_KEY) {
    toast.error("Notificaciones no configuradas en el servidor.");
    return false;
  }
  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    toast.error("Permiso denegado.");
    return false;
  }
  const reg = await getRegistration();
  if (!reg) {
    toast.error("No se pudo registrar el service worker.");
    return false;
  }
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        .buffer as ArrayBuffer,
    });
  }
  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    }),
  });
  const body = await res.json();
  if (!body.ok) {
    toast.error(body.error ?? "No se pudo guardar la subscripción.");
    return false;
  }
  toast.success("Notificaciones activadas ✓");
  return true;
}

async function unsubscribe(): Promise<void> {
  const reg = await getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
  }
  toast.success("Notificaciones desactivadas");
}

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    if (Notification.permission === "default") {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (!dismissed) setShow(true);
    }
  }, []);

  if (permission !== "default" || !show) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md animate-slide-up">
      <div className="flex items-start gap-3 rounded-2xl border border-white/40 bg-white/95 p-4 shadow-floating backdrop-blur-xl">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
          <Bell className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">Activar notificaciones</p>
          <p className="text-xs text-ink-muted">
            Recibe avisos de turnos nuevos y solicitudes incluso con la app cerrada.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                const ok = await subscribe();
                if (ok) setShow(false);
              }}
            >
              Activar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, "1");
                setShow(false);
              }}
            >
              Ahora no
            </Button>
          </div>
        </div>
        <button
          aria-label="Cerrar"
          className="text-ink-faint"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setShow(false);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PushToggle() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  if (permission === "unsupported") {
    return (
      <p className="text-xs text-ink-muted">
        Este navegador no soporta notificaciones. En iPhone añade la app a la pantalla
        de inicio para recibirlas.
      </p>
    );
  }

  const isOn = permission === "granted";
  return (
    <Button
      variant={isOn ? "secondary" : "default"}
      onClick={async () => {
        setBusy(true);
        try {
          if (isOn) {
            await unsubscribe();
            setPermission("default");
          } else {
            const ok = await subscribe();
            if (ok) setPermission("granted");
          }
        } finally {
          setBusy(false);
        }
      }}
      disabled={busy}
    >
      {isOn ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {isOn ? "Desactivar notificaciones" : "Activar notificaciones"}
    </Button>
  );
}
