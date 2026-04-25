"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepIndicator } from "@/components/step-indicator";
import { MonthCalendar } from "@/components/month-calendar";
import { addMinutesHM, formatHM12 } from "@/lib/time-format";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/utils";

const SHIFT_MINUTES = 8 * 60 + 30; // 8h 30min total (8h work + 30min break)
const BREAK_MINUTES = 30;

type Employee = {
  id: string;
  fullName: string;
  position: "SLOT_ATTENDANT" | "SUPERVISOR";
};

type BreakType = "NONE" | "VACATION" | "SICK" | "PERSONAL";

const STEPS = ["Días", "Empleados", "Horario"];

export function NewShiftFlow({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState(addMinutesHM("08:00", SHIFT_MINUTES));
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState(
    addMinutesHM("12:00", BREAK_MINUTES),
  );

  function onStartChange(value: string) {
    setStart(value);
    if (value) setEnd(addMinutesHM(value, SHIFT_MINUTES));
  }
  function onLunchStartChange(value: string) {
    setLunchStart(value);
    if (value) setLunchEnd(addMinutesHM(value, BREAK_MINUTES));
  }
  const [breakType, setBreakType] = useState<BreakType>("NONE");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(
    () =>
      employees.filter((e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()),
      ),
    [employees, search],
  );

  const totalShifts = selectedDates.size * selectedUsers.size;

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }

  function toggleUser(id: string) {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/schedules/batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          dates: Array.from(selectedDates),
          startTime: start,
          endTime: end,
          lunchStart: lunchStart || null,
          lunchEnd: lunchEnd || null,
          breakType,
          notes: notes || null,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudieron crear los turnos.");
        return;
      }
      toast.success(`${body.data.created} turno(s) creado(s) ✓`);
      celebrate();
      router.push("/admin/schedules");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && (
        <section className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card">
          <h2 className="mb-1 font-display text-base font-semibold">
            Selecciona día(s)
          </h2>
          <p className="mb-4 text-xs text-ink-muted">
            Toca varios días para crear turnos en lote.
          </p>
          <MonthCalendar
            selected={selectedDates}
            onToggle={toggleDate}
            minDate={today}
          />
        </section>
      )}

      {step === 1 && (
        <section className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card">
          <h2 className="mb-1 font-display text-base font-semibold">
            Selecciona empleado(s)
          </h2>
          <p className="mb-4 text-xs text-ink-muted">
            Toca para seleccionar varios.
          </p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre"
              className="pl-10"
            />
          </div>
          <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {filtered.map((e) => {
              const selected = selectedUsers.has(e.id);
              const initials = e.fullName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => toggleUser(e.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      selected
                        ? "border-brand-400 bg-brand-50 shadow-card"
                        : "border-border bg-surface-raised hover:border-brand-200",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                        selected
                          ? "bg-brand-500 text-white"
                          : "bg-brand-100 text-brand-700",
                      )}
                    >
                      {selected ? <Check className="h-5 w-5" /> : initials}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{e.fullName}</p>
                      <p className="text-xs text-ink-muted">
                        {e.position === "SLOT_ATTENDANT"
                          ? "Slot Attendant"
                          : "Supervisor"}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="py-6 text-center text-sm text-ink-muted">
                Sin resultados.
              </li>
            )}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card">
          <h2 className="mb-1 font-display text-base font-semibold">
            Horario y break
          </h2>
          <p className="mb-4 text-xs text-ink-muted">
            Aplica a todos los turnos seleccionados.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start">Entrada</Label>
              <Input
                id="start"
                type="time"
                value={start}
                onChange={(e) => onStartChange(e.target.value)}
                required
              />
              <p className="text-xs text-ink-faint">{formatHM12(start)}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="end">
                Salida{" "}
                <span className="text-ink-faint font-normal">
                  · auto +8h30
                </span>
              </Label>
              <Input
                id="end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
              <p className="text-xs text-ink-faint">{formatHM12(end)}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lstart">Break inicio</Label>
              <Input
                id="lstart"
                type="time"
                value={lunchStart}
                onChange={(e) => onLunchStartChange(e.target.value)}
              />
              <p className="text-xs text-ink-faint">{formatHM12(lunchStart)}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lend">
                Break fin{" "}
                <span className="text-ink-faint font-normal">· auto +30m</span>
              </Label>
              <Input
                id="lend"
                type="time"
                value={lunchEnd}
                onChange={(e) => setLunchEnd(e.target.value)}
              />
              <p className="text-xs text-ink-faint">{formatHM12(lunchEnd)}</p>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Tipo</Label>
              <Select
                value={breakType}
                onValueChange={(v) => setBreakType(v as BreakType)}
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
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-brand-50 p-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Se crearán
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-brand-700">
              {totalShifts} turno{totalShifts === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-ink-muted">
              {selectedDates.size} día(s) × {selectedUsers.size} empleado(s)
            </p>
          </div>
        </section>
      )}

      {/* Navegación inferior */}
      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] flex justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Atrás
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 0 && selectedDates.size === 0) ||
              (step === 1 && selectedUsers.size === 0)
            }
          >
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={submit}
            disabled={submitting || totalShifts === 0}
          >
            {submitting ? "Creando…" : `Crear ${totalShifts} turno(s)`}
          </Button>
        )}
      </div>

      {(selectedDates.size > 0 || selectedUsers.size > 0) && step < 2 && (
        <p className="text-center text-xs text-ink-muted">
          Seleccionados: {selectedDates.size} día(s) · {selectedUsers.size}{" "}
          empleado(s)
        </p>
      )}
    </div>
  );
}

