"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ShiftRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  lunchStart: string | null;
  lunchEnd: string | null;
  breakType: "NONE" | "VACATION" | "SICK" | "PERSONAL";
  notes: string | null;
  signed: boolean;
  signedAt: string | null;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function breakLabel(breakType: ShiftRow["breakType"]) {
  switch (breakType) {
    case "VACATION":
      return { label: "Vacaciones", variant: "success" as const };
    case "SICK":
      return { label: "Enfermedad", variant: "warning" as const };
    case "PERSONAL":
      return { label: "Personal", variant: "muted" as const };
    default:
      return null;
  }
}

export function ScheduleTable({ shifts }: { shifts: ShiftRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function sign(id: string) {
    setPending(id);
    try {
      const res = await fetch(`/api/schedules/${id}/sign`, { method: "POST" });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo firmar el horario.");
        return;
      }
      toast.success("Horario firmado ✓");
      startTransition(() => router.refresh());
    } finally {
      setPending(null);
    }
  }

  if (shifts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No tienes turnos programados en las próximas semanas.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="rounded-l-xl px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Horario</th>
            <th className="px-4 py-3">Almuerzo</th>
            <th className="px-4 py-3">Notas</th>
            <th className="px-4 py-3">Estado</th>
            <th className="rounded-r-xl px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((s, idx) => {
            const brk = breakLabel(s.breakType);
            return (
              <tr
                key={s.id}
                className={
                  idx % 2 === 0
                    ? "bg-surface-raised"
                    : "bg-surface-sunken/60"
                }
              >
                <td className="border-b border-border px-4 py-3 align-top capitalize">
                  {formatDate(s.date)}
                </td>
                <td className="border-b border-border px-4 py-3 align-top">
                  {formatTime(s.startTime)} – {formatTime(s.endTime)}
                </td>
                <td className="border-b border-border px-4 py-3 align-top">
                  {s.lunchStart && s.lunchEnd
                    ? `${formatTime(s.lunchStart)} – ${formatTime(s.lunchEnd)}`
                    : "—"}
                </td>
                <td className="border-b border-border px-4 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    {brk && <Badge variant={brk.variant}>{brk.label}</Badge>}
                    {s.notes && (
                      <span className="text-xs text-ink-muted">{s.notes}</span>
                    )}
                  </div>
                </td>
                <td className="border-b border-border px-4 py-3 align-top">
                  {s.signed ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Firmado
                    </Badge>
                  ) : (
                    <Badge variant="warning">Pendiente</Badge>
                  )}
                </td>
                <td className="border-b border-border px-4 py-3 text-right align-top">
                  {s.signed ? (
                    <span className="text-xs text-ink-muted">
                      {s.signedAt
                        ? new Date(s.signedAt).toLocaleString("es-ES", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : ""}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => sign(s.id)}
                      disabled={pending === s.id}
                    >
                      {pending === s.id ? "Firmando…" : "Firmar"}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
