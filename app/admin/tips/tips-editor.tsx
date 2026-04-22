"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save, Coins, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateTips } from "@/lib/tips";
import { fromDateString, formatWeekdayShort } from "@/lib/dates";
import { formatMoney } from "@/lib/utils";

type Employee = {
  userId: string;
  fullName: string;
  hours: Record<string, number>;
};

type Props = {
  weekStartStr: string;
  weekEndStr: string;
  prevWeekStr: string;
  nextWeekStr: string;
  days: string[]; // YYYY-MM-DD × 7
  employees: Employee[];
  dailyTips: Record<string, number>;
  hourlyRate: number;
  preparedBy: string;
};

export function TipsEditor(props: Props) {
  const router = useRouter();
  const [employees, setEmployees] = useState(props.employees);
  const [dailyTips, setDailyTips] = useState(props.dailyTips);
  const [hourlyRate, setHourlyRate] = useState(props.hourlyRate);
  const [saving, setSaving] = useState(false);

  const calc = useMemo(
    () => calculateTips({ employees, dailyTips, hourlyRate }),
    [employees, dailyTips, hourlyRate],
  );

  function updateHours(userId: string, dayKey: string, value: string) {
    const n = value === "" ? 0 : Number(value);
    setEmployees((prev) =>
      prev.map((e) =>
        e.userId === userId
          ? {
              ...e,
              hours: {
                ...e.hours,
                [dayKey]: Number.isFinite(n) ? n : 0,
              },
            }
          : e,
      ),
    );
  }

  function updateDailyTip(dayKey: string, value: string) {
    const n = value === "" ? 0 : Number(value);
    setDailyTips((prev) => ({ ...prev, [dayKey]: Number.isFinite(n) ? n : 0 }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          weekStart: props.weekStartStr,
          weekEnd: props.weekEndStr,
          hourlyRate,
          preparedBy: props.preparedBy,
          employees: employees.map((e) => ({
            userId: e.userId,
            hours: e.hours,
          })),
          dailyTips,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo guardar el reporte.");
        return;
      }
      toast.success("Reporte guardado ✓");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const weekStartDate = fromDateString(props.weekStartStr);
  const weekEndDate = fromDateString(props.weekEndStr);
  const weekLabel = `${weekStartDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  })} – ${weekEndDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Semana + guardar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`?week=${encodeURIComponent(props.prevWeekStr)}`}>
            <Button variant="ghost" size="icon" aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-[220px] text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Semana
            </p>
            <p className="font-display text-sm font-bold">{weekLabel}</p>
          </div>
          <Link href={`?week=${encodeURIComponent(props.nextWeekStr)}`}>
            <Button variant="ghost" size="icon" aria-label="Semana siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {/* KPIs arriba */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile
          icon={<Coins className="h-5 w-5" />}
          label="Total Propinas"
          value={formatMoney(calc.totalTipWeek)}
          highlight
        />
        <KpiTile
          icon={<Clock className="h-5 w-5" />}
          label="Total Horas"
          value={`${calc.totalHoursWeek}h`}
        />
        <KpiTile
          icon={<Coins className="h-5 w-5" />}
          label="Propina / Hora"
          value={formatMoney(calc.tipPerHour)}
        />
        <KpiTile
          icon={<Coins className="h-5 w-5" />}
          label="Pago Total / Hora"
          value={formatMoney(calc.payPerHour)}
          hint={`Rate ${formatMoney(hourlyRate)} + propinas`}
        />
      </div>

      {/* Horas trabajadas por empleado (mobile-friendly) */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card">
        <h3 className="mb-2 font-display text-base font-semibold">
          Horas trabajadas
        </h3>
        <p className="mb-4 text-xs text-ink-muted">
          Ingresa las horas de cada Slot Attendant por día.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-brand-50 text-left text-brand-700">
                <th className="sticky left-0 z-10 bg-brand-50 px-3 py-2">
                  Empleado
                </th>
                {props.days.map((d) => {
                  const date = fromDateString(d);
                  return (
                    <th key={d} className="px-2 py-2 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-wider">
                        {formatWeekdayShort(date)}
                      </div>
                      <div className="font-bold">{date.getDate()}</div>
                    </th>
                  );
                })}
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const total = props.days.reduce(
                  (acc, k) => acc + (emp.hours[k] ?? 0),
                  0,
                );
                return (
                  <tr
                    key={emp.userId}
                    className="border-t border-border hover:bg-surface-sunken/40"
                  >
                    <td className="sticky left-0 z-10 bg-surface-raised px-3 py-2 font-medium">
                      {emp.fullName}
                    </td>
                    {props.days.map((k) => (
                      <td key={k} className="px-1 py-1 text-center">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.5"
                          className="h-9 w-14 text-center px-1"
                          value={emp.hours[k] ?? 0}
                          onChange={(e) =>
                            updateHours(emp.userId, k, e.target.value)
                          }
                        />
                      </td>
                    ))}
                    <td className="bg-brand-50 px-3 py-2 text-right font-semibold">
                      {total.toFixed(total % 1 === 0 ? 0 : 2)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-border bg-success/40 font-semibold">
                <td className="sticky left-0 z-10 bg-success/40 px-3 py-2">
                  Horas totales del día
                </td>
                {props.days.map((k) => {
                  const total = employees.reduce(
                    (acc, e) => acc + (e.hours[k] ?? 0),
                    0,
                  );
                  return (
                    <td key={k} className="px-3 py-2 text-center">
                      {total}
                    </td>
                  );
                })}
                <td className="bg-brand-500 px-3 py-2 text-right text-white">
                  {calc.totalHoursWeek}h
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Propinas por día */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card">
        <h3 className="mb-2 font-display text-base font-semibold">
          💰 Propinas generadas por día
        </h3>
        <p className="mb-4 text-xs text-ink-muted">
          Monto total de propinas recaudado cada día.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {props.days.map((d) => {
            const date = fromDateString(d);
            return (
              <div
                key={d}
                className="rounded-2xl bg-accent-soft p-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  {formatWeekdayShort(date)} {date.getDate()}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-sm font-bold text-ink">$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    className="h-9 flex-1 px-1 text-right font-semibold"
                    value={dailyTips[d] ?? 0}
                    onChange={(e) => updateDailyTip(d, e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rate por hora */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="rate" className="text-sm">
              Rate por hora (salario base)
            </Label>
            <p className="text-xs text-ink-muted">
              Se suma a la propina por hora para calcular el pago total.
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">$</span>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              className="h-10 w-24 text-right"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Distribución por empleado */}
      <section className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card">
        <h3 className="mb-1 font-display text-base font-semibold">
          Distribución de propinas
        </h3>
        <p className="mb-4 text-xs text-ink-muted">
          Cada empleado recibe propina proporcional a sus horas trabajadas.
        </p>
        <ul className="flex flex-col gap-2">
          {calc.perEmployee.map((e) => {
            const pct =
              calc.totalTipWeek > 0
                ? (e.tipEarned / calc.totalTipWeek) * 100
                : 0;
            return (
              <li
                key={e.userId}
                className="rounded-2xl border border-border bg-surface-sunken/60 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.fullName}</p>
                    <p className="text-xs text-ink-muted">
                      {e.hoursWorked}h trabajadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-bold text-brand-700">
                      {formatMoney(e.tipEarned)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      + salario = {formatMoney(e.totalComp)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-center text-xs text-ink-faint">
        Preparado por <strong>{props.preparedBy}</strong>
      </p>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border border-brand-300 bg-gradient-to-br from-brand-100 to-accent-soft p-4 shadow-card"
          : "rounded-2xl border border-border bg-surface-raised p-4 shadow-card"
      }
    >
      <div className="mb-1 flex items-center gap-1.5 text-brand-700">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-display text-xl font-bold text-ink">{value}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
