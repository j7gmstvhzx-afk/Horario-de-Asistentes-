"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { detectConflicts } from "@/lib/conflicts";
import { formatDateShort, formatWeekday } from "@/lib/dates";

type Employee = {
  id: string;
  fullName: string;
  position: "SLOT_ATTENDANT" | "SUPERVISOR";
};

type ShiftData = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  lunchStart: string | null;
  lunchEnd: string | null;
  breakType: "NONE" | "VACATION" | "SICK" | "PERSONAL";
  notes: string | null;
  signed: boolean;
};

export function SchedulesEditor({
  weekStartIso,
  days,
  employees,
  shifts,
  prevWeekIso,
  nextWeekIso,
}: {
  weekStartIso: string;
  days: string[];
  employees: Employee[];
  shifts: ShiftData[];
  prevWeekIso: string;
  nextWeekIso: string;
}) {
  const router = useRouter();

  const conflicts = useMemo(
    () =>
      detectConflicts(
        shifts.map((s) => {
          const emp = employees.find((e) => e.id === s.userId);
          return {
            id: s.id,
            userId: s.userId,
            userName: emp?.fullName ?? "?",
            date: new Date(s.date),
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            lunchStart: s.lunchStart ? new Date(s.lunchStart) : null,
            lunchEnd: s.lunchEnd ? new Date(s.lunchEnd) : null,
          };
        }),
      ),
    [shifts, employees],
  );

  const conflictIds = new Set<string>();
  for (const c of conflicts) {
    conflictIds.add(c.a.id);
    conflictIds.add(c.b.id);
  }

  const shiftsByDay = (dayIso: string) =>
    shifts.filter((s) => s.date.slice(0, 10) === dayIso.slice(0, 10));

  async function deleteShift(id: string) {
    if (!confirm("¿Eliminar este turno?")) return;
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    const body = await res.json();
    if (!body.ok) {
      toast.error(body.error ?? "No se pudo eliminar el turno.");
      return;
    }
    toast.success("Turno eliminado.");
    router.refresh();
  }

  const weekLabel = new Date(weekStartIso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`?week=${encodeURIComponent(prevWeekIso)}`}>
            <Button variant="ghost" size="icon" aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-[180px] text-center">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Semana del
            </p>
            <p className="font-medium">{weekLabel}</p>
          </div>
          <Link href={`?week=${encodeURIComponent(nextWeekIso)}`}>
            <Button variant="ghost" size="icon" aria-label="Semana siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <NewShiftButton employees={employees} defaultDate={days[0] ?? weekStartIso} />
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-xl border border-danger bg-danger/20 px-4 py-3 text-sm text-danger-fg">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {conflicts.length} conflicto(s) detectado(s):
          </div>
          <ul className="mt-2 list-disc pl-5">
            {conflicts.slice(0, 5).map((c, i) => (
              <li key={i}>
                {c.date.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}{" "}
                · {c.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-7 gap-3">
          {days.map((day) => {
            const ds = shiftsByDay(day);
            return (
              <div
                key={day}
                className="rounded-xl border border-border bg-surface-raised p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-muted">
                      {formatWeekday(new Date(day))}
                    </p>
                    <p className="text-sm font-medium">
                      {formatDateShort(new Date(day))}
                    </p>
                  </div>
                  <NewShiftButton
                    employees={employees}
                    defaultDate={day}
                    size="icon"
                  />
                </div>
                <ul className="flex flex-col gap-2">
                  {ds.length === 0 && (
                    <li className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-ink-muted">
                      Sin turnos
                    </li>
                  )}
                  {ds.map((s) => {
                    const emp = employees.find((e) => e.id === s.userId);
                    const isConflict = conflictIds.has(s.id);
                    return (
                      <li
                        key={s.id}
                        className={`rounded-lg border p-2 text-xs ${
                          isConflict
                            ? "border-danger bg-danger/20"
                            : "border-border bg-surface-sunken/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-ink">
                              {emp?.fullName ?? "Desconocido"}
                            </p>
                            <p className="text-ink-muted">
                              {new Date(s.startTime).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              –{" "}
                              {new Date(s.endTime).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {s.lunchStart && s.lunchEnd && (
                              <p className="text-ink-muted">
                                🍽{" "}
                                {new Date(s.lunchStart).toLocaleTimeString(
                                  "es-ES",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                                –
                                {new Date(s.lunchEnd).toLocaleTimeString(
                                  "es-ES",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </p>
                            )}
                            <div className="mt-1 flex flex-wrap gap-1">
                              {s.breakType !== "NONE" && (
                                <Badge
                                  variant={
                                    s.breakType === "VACATION"
                                      ? "success"
                                      : s.breakType === "SICK"
                                      ? "warning"
                                      : "muted"
                                  }
                                >
                                  {s.breakType === "VACATION"
                                    ? "Vacaciones"
                                    : s.breakType === "SICK"
                                    ? "Enfermedad"
                                    : "Personal"}
                                </Badge>
                              )}
                              {s.signed && <Badge variant="success">Firmado</Badge>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteShift(s.id)}
                            aria-label="Eliminar turno"
                            disabled={s.signed}
                            title={s.signed ? "No se puede eliminar (firmado)" : "Eliminar"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NewShiftButton({
  employees,
  defaultDate,
  size = "sm",
}: {
  employees: Employee[];
  defaultDate: string;
  size?: "sm" | "icon";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(employees[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate.slice(0, 10));
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("16:00");
  const [lunchStart, setLunchStart] = useState("");
  const [lunchEnd, setLunchEnd] = useState("");
  const [breakType, setBreakType] = useState<"NONE" | "VACATION" | "SICK" | "PERSONAL">(
    "NONE",
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          date,
          startTime: `${date}T${start}:00`,
          endTime: `${date}T${end}:00`,
          lunchStart: lunchStart ? `${date}T${lunchStart}:00` : null,
          lunchEnd: lunchEnd ? `${date}T${lunchEnd}:00` : null,
          breakType,
          notes: notes || null,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo crear el turno.");
        return;
      }
      toast.success("Turno creado.");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {size === "icon" ? (
          <Button variant="ghost" size="icon" aria-label="Nuevo turno">
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nuevo turno
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Nuevo turno</DialogTitle>
          <DialogDescription>
            También puedes marcar vacaciones o enfermedad desde aquí.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Empleado</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegir empleado" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select
              value={breakType}
              onValueChange={(v) =>
                setBreakType(v as "NONE" | "VACATION" | "SICK" | "PERSONAL")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Turno normal</SelectItem>
                <SelectItem value="VACATION">Vacaciones</SelectItem>
                <SelectItem value="SICK">Enfermedad</SelectItem>
                <SelectItem value="PERSONAL">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="start">Entrada</Label>
            <Input
              id="start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="end">Salida</Label>
            <Input
              id="end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lstart">Almuerzo (inicio)</Label>
            <Input
              id="lstart"
              type="time"
              value={lunchStart}
              onChange={(e) => setLunchStart(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lend">Almuerzo (fin)</Label>
            <Input
              id="lend"
              type="time"
              value={lunchEnd}
              onChange={(e) => setLunchEnd(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
            />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Crear turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
