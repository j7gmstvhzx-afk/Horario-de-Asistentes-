"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fromDateString, isNextWeek, isThisWeek } from "@/lib/dates";
import { formatTime } from "@/lib/time-format";

type PendingShift = {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  breakType: "NONE" | "VACATION" | "SICK" | "PERSONAL";
};

export function PendingSignaturesModal({
  pending,
}: {
  pending: PendingShift[];
}) {
  const [open, setOpen] = useState(pending.length > 0);
  const router = useRouter();

  const hasNextWeek = useMemo(
    () => pending.some((s) => isNextWeek(fromDateString(s.date))),
    [pending],
  );

  const size: "md" | "xl" = hasNextWeek ? "xl" : "md";

  const thisWeek = pending.filter((s) => isThisWeek(fromDateString(s.date)));
  const nextWeek = pending.filter((s) => isNextWeek(fromDateString(s.date)));

  async function signAll() {
    const results = await Promise.all(
      pending.map((s) =>
        fetch(`/api/schedules/${s.id}/sign`, { method: "POST" }).then((r) =>
          r.json(),
        ),
      ),
    );
    const failed = results.filter((r: { ok: boolean }) => !r.ok);
    if (failed.length === 0) {
      toast.success("Todos los horarios firmados ✓");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(`No se pudieron firmar ${failed.length} turno(s).`);
    }
  }

  if (pending.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size={size} className={hasNextWeek ? "border-warning" : undefined}>
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            {hasNextWeek ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning text-warning-fg">
                <AlertTriangle className="h-5 w-5" />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <PenLine className="h-5 w-5" />
              </span>
            )}
            <DialogTitle>
              {hasNextWeek
                ? "Tienes horarios de la PRÓXIMA SEMANA sin firmar"
                : "Horarios pendientes de firma"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {hasNextWeek
              ? "Es importante que firmes ahora para confirmar disponibilidad de la próxima semana."
              : "Firma para confirmar que estás de acuerdo con el horario asignado."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-3 text-sm">
          {nextWeek.length > 0 && (
            <PendingGroup title="Próxima semana" items={nextWeek} highlight />
          )}
          {thisWeek.length > 0 && (
            <PendingGroup title="Esta semana" items={thisWeek} />
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Recordar después
          </Button>
          <Link href="/employee/schedule">
            <Button variant="outline">Ver detalles</Button>
          </Link>
          <Button onClick={signAll}>Firmar todos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PendingGroup({
  title,
  items,
  highlight,
}: {
  title: string;
  items: PendingShift[];
  highlight?: boolean;
}) {
  return (
    <section
      className={
        highlight
          ? "rounded-xl border border-warning bg-warning/30 p-3"
          : "rounded-xl border border-border bg-surface-sunken p-3"
      }
    >
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title} · {items.length}
      </h4>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((s) => {
          const d = fromDateString(s.date);
          return (
            <li
              key={s.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="capitalize">
                {d.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <span className="text-ink-muted">
                {formatTime(s.startTime)} – {formatTime(s.endTime)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
