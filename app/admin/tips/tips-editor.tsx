"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateTips } from "@/lib/tips";
import { formatDateShort, formatWeekday } from "@/lib/dates";
import { formatMoney } from "@/lib/utils";

type Employee = {
  userId: string;
  fullName: string;
  hours: Record<string, number>;
};

type TipsEditorProps = {
  weekStartIso: string;
  weekEndIso: string;
  prevWeekIso: string;
  nextWeekIso: string;
  days: string[];
  employees: Employee[];
  dailyTips: Record<string, number>;
  hourlyRate: number;
  preparedBy: string;
  existingReportId: string | null;
};

export function TipsEditor(props: TipsEditorProps) {
  const router = useRouter();
  const [employees, setEmployees] = useState(props.employees);
  const [dailyTips, setDailyTips] = useState(props.dailyTips);
  const [hourlyRate, setHourlyRate] = useState(props.hourlyRate);
  const [saving, setSaving] = useState(false);

  const dayKeys = props.days.map((d) => d.slice(0, 10));

  const calc = useMemo(
    () =>
      calculateTips({
        employees,
        dailyTips,
        hourlyRate,
      }),
    [employees, dailyTips, hourlyRate],
  );

  function updateHours(userId: string, dayKey: string, value: string) {
    const n = value === "" ? 0 : Number(value);
    setEmployees((prev) =>
      prev.map((e) =>
        e.userId === userId
          ? {
              ...e,
              hours: { ...e.hours, [dayKey]: Number.isFinite(n) ? n : 0 },
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
          weekStart: props.weekStartIso.slice(0, 10),
          weekEnd: props.weekEndIso.slice(0, 10),
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
      toast.success("Reporte de propinas guardado ✓");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const weekLabel = `${new Date(props.weekStartIso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  })} – ${new Date(props.weekEndIso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`?week=${encodeURIComponent(props.prevWeekIso)}`}>
            <Button variant="ghost" size="icon" aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-[220px] text-center">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Semana
            </p>
            <p className="font-medium">{weekLabel}</p>
          </div>
          <Link href={`?week=${encodeURIComponent(props.nextWeekIso)}`}>
            <Button variant="ghost" size="icon" aria-label="Semana siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar reporte"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-brand-50 text-brand-700">
              <th className="sticky left-0 z-10 bg-brand-50 px-3 py-2 text-left">
                DATE
              </th>
              {props.days.map((d) => (
                <th key={d} className="px-3 py-2 text-center">
                  <div className="text-xs uppercase tracking-wide">
                    {formatWeekday(new Date(d))}
                  </div>
                  <div className="font-semibold">
                    {formatDateShort(new Date(d))}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-right">Total Horas</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const total = dayKeys.reduce((acc, k) => acc + (emp.hours[k] ?? 0), 0);
              return (
                <tr
                  key={emp.userId}
                  className="border-t border-border hover:bg-surface-sunken/40"
                >
                  <td className="sticky left-0 z-10 bg-surface-raised px-3 py-2 font-medium">
                    {emp.fullName}
                  </td>
                  {dayKeys.map((k) => (
                    <td key={k} className="px-2 py-1 text-center">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        className="h-9 w-16 text-center"
                        value={emp.hours[k] ?? 0}
                        onChange={(e) => updateHours(emp.userId, k, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="bg-brand-100 px-3 py-2 text-right font-semibold">
                    {total.toFixed(total % 1 === 0 ? 0 : 2)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-border bg-success/40">
              <td className="sticky left-0 z-10 bg-success/40 px-3 py-2 font-semibold">
                Total Horas Trabajadas
              </td>
              {dayKeys.map((k) => {
                const total = employees.reduce(
                  (acc, e) => acc + (e.hours[k] ?? 0),
                  0,
                );
                return (
                  <td key={k} className="px-3 py-2 text-center font-semibold">
                    {total}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-right font-bold text-success-fg">
                TOTAL TIP
              </td>
            </tr>
            <tr className="border-t border-border">
              <td className="sticky left-0 z-10 bg-accent-soft px-3 py-2 text-xs uppercase tracking-wide text-ink-muted">
                Propina por día
              </td>
              {dayKeys.map((k) => (
                <td key={k} className="px-2 py-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-9 w-full text-center"
                    value={dailyTips[k] ?? 0}
                    onChange={(e) => updateDailyTip(k, e.target.value)}
                  />
                </td>
              ))}
              <td className="bg-yellow-200 px-3 py-2 text-right font-bold">
                {formatMoney(calc.totalTipWeek)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-raised">
          <header className="border-b border-border bg-brand-50 px-4 py-2">
            <h3 className="font-display text-sm font-semibold">
              Distribución de Propinas
            </h3>
          </header>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-3 py-2 text-left">Slot Attendant</th>
                <th className="px-3 py-2 text-right">Total of TIP</th>
              </tr>
            </thead>
            <tbody>
              {calc.perEmployee.map((e) => (
                <tr key={e.userId} className="border-t border-border">
                  <td className="px-3 py-2">{e.fullName}</td>
                  <td className="bg-brand-50 px-3 py-2 text-right font-semibold">
                    {formatMoney(e.tipEarned)}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-border bg-yellow-200 font-bold">
                <td className="px-3 py-2">Total Tip Distribution</td>
                <td className="px-3 py-2 text-right">
                  {formatMoney(calc.totalTipWeek)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface-raised p-5">
          <h3 className="mb-4 font-display text-sm font-semibold">
            Cálculos
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Total Horas Trabajadas"
              value={calc.totalHoursWeek.toString()}
            />
            <Field
              label="Propina por Hora"
              value={formatMoney(calc.tipPerHour)}
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rate">Rate Por Hora</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
              />
            </div>
            <Field
              label="Pago Total Por Hora"
              value={formatMoney(calc.payPerHour)}
            />
            <Field
              label="Total Propinas + Salario (40h ref.)"
              value={formatMoney(40 * calc.payPerHour)}
              highlight
            />
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Preparado por: <strong>{props.preparedBy}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-sunken/50 px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <span
        className={
          highlight
            ? "rounded-lg bg-accent-soft px-3 py-1 font-display text-base font-semibold"
            : "font-medium text-brand-700"
        }
      >
        {value}
      </span>
    </div>
  );
}
