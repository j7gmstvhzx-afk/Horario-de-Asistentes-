"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Clock, Coffee, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fromDateString } from "@/lib/dates";
import { formatHM12, formatRangeHM12 } from "@/lib/time-format";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/utils";

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

export function ScheduleList({ shifts }: { shifts: ShiftRow[] }) {
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
      celebrate();
      startTransition(() => router.refresh());
    } finally {
      setPending(null);
    }
  }

  if (shifts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-raised p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-ink-faint" />
        <p className="mt-3 text-sm font-medium">Sin turnos programados</p>
        <p className="text-xs text-ink-muted">
          Tu administrador aún no te ha asignado horarios.
        </p>
      </div>
    );
  }

  // Group shifts by date.
  const groups = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const list = groups.get(s.date) ?? [];
    list.push(s);
    groups.set(s.date, list);
  }

  return (
    <ul className="flex flex-col gap-5">
      {[...groups.entries()].map(([date, rows]) => {
        const d = fromDateString(date);
        return (
          <li key={date}>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {d
                .toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
                .replace(/^\w/, (c) => c.toUpperCase())}
            </h3>
            <ul className="flex flex-col gap-2">
              {rows.map((s) => {
                const brk = breakLabel(s.breakType);
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-card",
                      s.signed && "border-l-4 border-l-success-fg",
                      !s.signed && brk === null && "border-l-4 border-l-warning-fg",
                      brk !== null && "border-l-4 border-l-brand-500",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold">
                          {formatRangeHM12(s.startTime, s.endTime)}
                        </p>
                        {s.lunchStart && s.lunchEnd && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                            <Coffee className="h-3.5 w-3.5" />
                            Break {formatHM12(s.lunchStart)} –{" "}
                            {formatHM12(s.lunchEnd)}
                          </p>
                        )}
                        {s.notes && (
                          <p className="mt-1 text-xs text-ink-muted">
                            {s.notes}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {brk && <Badge variant={brk.variant}>{brk.label}</Badge>}
                          {s.signed ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Firmado
                            </Badge>
                          ) : brk === null ? (
                            <Badge variant="warning">Sin firmar</Badge>
                          ) : null}
                          {s.signedAt && (
                            <span className="text-[10px] text-ink-faint">
                              {new Date(s.signedAt).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      {!s.signed && brk === null && (
                        <Button
                          size="sm"
                          onClick={() => sign(s.id)}
                          disabled={pending === s.id}
                          className="shrink-0"
                        >
                          <PenLine className="h-4 w-4" />
                          {pending === s.id ? "…" : "Firmar"}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
