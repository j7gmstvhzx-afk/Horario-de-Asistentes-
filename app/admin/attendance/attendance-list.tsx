"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fromDateString, formatRangeDesdeHasta } from "@/lib/dates";
import { formatHM12, formatRangeHM12 } from "@/lib/time-format";
import { addWeeks } from "date-fns";
import { cn } from "@/lib/utils";

type AttendanceStatus = "ON_TIME" | "LATE" | "ABSENT" | "EXCUSED";

type ShiftRow = {
  id: string;
  userName: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  attendance: {
    status: AttendanceStatus;
    minutesLate: number;
    clockIn: string | null;
    clockOut: string | null;
    notes: string | null;
  } | null;
};

export function AttendanceList({
  weekStartStr,
  prevWeekStr,
  nextWeekStr,
  shifts,
}: {
  weekStartStr: string;
  prevWeekStr: string;
  nextWeekStr: string;
  shifts: ShiftRow[];
}) {
  const weekStart = fromDateString(weekStartStr);
  const weekEnd = addWeeks(weekStart, 1);
  weekEnd.setDate(weekEnd.getDate() - 1);

  const groups = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const list = groups.get(s.date) ?? [];
    list.push(s);
    groups.set(s.date, list);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={`?week=${encodeURIComponent(prevWeekStr)}`}>
          <Button variant="ghost" size="icon" aria-label="Semana anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <p className="font-display text-[11px] font-bold leading-tight text-center">
          {formatRangeDesdeHasta(weekStart, weekEnd)}
        </p>
        <Link href={`?week=${encodeURIComponent(nextWeekStr)}`}>
          <Button variant="ghost" size="icon" aria-label="Semana siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {shifts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface-raised p-8 text-center text-sm text-ink-muted">
          No hay turnos en esta semana.
        </div>
      )}

      {[...groups.entries()].map(([date, rows]) => {
        const d = fromDateString(date);
        return (
          <section key={date}>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {d
                .toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                .replace(/^./, (c) => c.toUpperCase())}
            </h3>
            <ul className="flex flex-col gap-2">
              {rows.map((s) => (
                <ShiftAttendanceCard key={s.id} shift={s} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function statusBadge(status: AttendanceStatus, minutesLate: number) {
  switch (status) {
    case "ON_TIME":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />A tiempo
        </Badge>
      );
    case "LATE":
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="h-3 w-3" />
          Tarde {minutesLate}min
        </Badge>
      );
    case "ABSENT":
      return (
        <Badge variant="danger" className="gap-1">
          <XCircle className="h-3 w-3" />
          Ausente
        </Badge>
      );
    case "EXCUSED":
      return (
        <Badge variant="muted" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Justificado
        </Badge>
      );
  }
}

function ShiftAttendanceCard({ shift }: { shift: ShiftRow }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [status, setStatus] = useState<AttendanceStatus>(
    shift.attendance?.status ?? "ON_TIME",
  );
  const [clockIn, setClockIn] = useState(
    shift.attendance?.clockIn
      ? new Date(shift.attendance.clockIn).toISOString().slice(11, 16)
      : shift.startTime ?? "",
  );
  const [clockOut, setClockOut] = useState(
    shift.attendance?.clockOut
      ? new Date(shift.attendance.clockOut).toISOString().slice(11, 16)
      : shift.endTime ?? "",
  );
  const [notes, setNotes] = useState(shift.attendance?.notes ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shiftId: shift.id,
          status,
          clockIn: status === "ABSENT" ? null : clockIn || null,
          clockOut: status === "ABSENT" ? null : clockOut || null,
          notes: notes || null,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo guardar.");
        return;
      }
      toast.success("Asistencia registrada ✓");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <li
      className={cn(
        "rounded-2xl border bg-surface-raised p-4 shadow-card",
        shift.attendance?.status === "ABSENT" && "border-danger",
        shift.attendance?.status === "LATE" && "border-warning",
        !shift.attendance && "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{shift.userName}</p>
          <p className="text-sm text-ink-muted">
            Programado: {formatRangeHM12(shift.startTime, shift.endTime)}
          </p>
          {shift.attendance?.clockIn && (
            <p className="text-xs text-ink-muted">
              Entró:{" "}
              {formatHM12(
                new Date(shift.attendance.clockIn)
                  .toISOString()
                  .slice(11, 16),
              )}
              {shift.attendance.clockOut &&
                ` · Salió: ${formatHM12(new Date(shift.attendance.clockOut).toISOString().slice(11, 16))}`}
            </p>
          )}
          <div className="mt-1.5">
            {shift.attendance ? (
              statusBadge(
                shift.attendance.status,
                shift.attendance.minutesLate,
              )
            ) : (
              <Badge variant="muted">Sin registrar</Badge>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant={shift.attendance ? "secondary" : "default"}
          onClick={() => setOpen(true)}
        >
          {shift.attendance ? "Editar" : "Registrar"}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asistencia · {shift.userName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as AttendanceStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON_TIME">A tiempo</SelectItem>
                  <SelectItem value="LATE">Tarde</SelectItem>
                  <SelectItem value="ABSENT">Ausente</SelectItem>
                  <SelectItem value="EXCUSED">Justificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status !== "ABSENT" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cin">Entró a las</Label>
                  <Input
                    id="cin"
                    type="time"
                    value={clockIn}
                    onChange={(e) => setClockIn(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="cout">Salió a las</Label>
                  <Input
                    id="cout"
                    type="time"
                    value={clockOut}
                    onChange={(e) => setClockOut(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
