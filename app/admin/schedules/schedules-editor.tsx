"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Trash2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { detectBreakConflicts } from "@/lib/conflicts";
import { fromDateString, formatWeekday, formatRangeDesdeHasta } from "@/lib/dates";
import {
  formatHM12,
  formatRangeHM12,
  breakTypeLabel,
  breakTypeEmoji,
} from "@/lib/time-format";
import { addWeeks } from "date-fns";
import { cn } from "@/lib/utils";

type Employee = {
  id: string;
  fullName: string;
  position: "SLOT_ATTENDANT" | "SUPERVISOR";
};

type Shift = {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
  breakType: "NONE" | "VACATION" | "SICK" | "PERSONAL" | "DAY_OFF";
  notes: string | null;
  signed: boolean;
};

type Props = {
  weekStartStr: string;
  prevWeekStr: string;
  nextWeekStr: string;
  days: string[]; // YYYY-MM-DD × 7
  employees: Employee[];
  shifts: Shift[];
};

export function SchedulesList({
  weekStartStr,
  prevWeekStr,
  nextWeekStr,
  days,
  shifts,
}: Props) {
  const router = useRouter();

  const conflicts = useMemo(
    () =>
      detectBreakConflicts(
        shifts.map((s) => ({
          id: s.id,
          userId: s.userId,
          userName: s.userName,
          date: fromDateString(s.date),
          lunchStart: s.lunchStart,
          lunchEnd: s.lunchEnd,
        })),
      ),
    [shifts],
  );

  const conflictIds = new Set<string>();
  for (const c of conflicts) {
    conflictIds.add(c.a.id);
    conflictIds.add(c.b.id);
  }

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

  const weekStartDate = fromDateString(weekStartStr);
  const weekEndDate = addWeeks(weekStartDate, 1);
  weekEndDate.setDate(weekEndDate.getDate() - 1);
  const weekLabel = formatRangeDesdeHasta(weekStartDate, weekEndDate);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={`?week=${encodeURIComponent(prevWeekStr)}`}>
          <Button variant="ghost" size="icon" aria-label="Semana anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Semana
          </p>
          <p className="font-display text-[11px] font-bold leading-tight">
            {weekLabel}
          </p>
        </div>
        <Link href={`?week=${encodeURIComponent(nextWeekStr)}`}>
          <Button variant="ghost" size="icon" aria-label="Semana siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-danger bg-danger/25 p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-danger-fg">
            <AlertTriangle className="h-4 w-4" />
            {conflicts.length} break solapado(s)
          </div>
          <ul className="text-xs text-danger-fg/90">
            {conflicts.slice(0, 5).map((c, i) => (
              <li key={i}>
                •{" "}
                {c.date.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
                : {c.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {days.map((day) => {
          const daysShifts = shifts.filter((s) => s.date === day);
          const dayDate = fromDateString(day);
          return (
            <li key={day}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h3 className="font-display text-sm font-semibold capitalize">
                  {formatWeekday(dayDate)}{" "}
                  <span className="text-ink-muted">{dayDate.getDate()}</span>
                </h3>
                <span className="text-xs text-ink-muted">
                  {daysShifts.length} turno
                  {daysShifts.length === 1 ? "" : "s"}
                </span>
              </div>
              {daysShifts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface-raised/50 p-3 text-center text-xs text-ink-muted">
                  Sin turnos
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {daysShifts.map((s) => {
                    const isConflict = conflictIds.has(s.id);
                    return (
                      <li
                        key={s.id}
                        className={cn(
                          "rounded-2xl border bg-surface-raised p-3 shadow-card",
                          isConflict
                            ? "border-danger bg-danger/15"
                            : "border-border",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {s.userName}
                            </p>
                            <p className="text-sm text-ink">
                              {s.breakType !== "NONE"
                                ? `${breakTypeEmoji(s.breakType)} ${breakTypeLabel(s.breakType)}`
                                : formatRangeHM12(s.startTime, s.endTime)}
                            </p>
                            {s.breakType === "NONE" &&
                              s.lunchStart &&
                              s.lunchEnd && (
                                <p
                                  className={cn(
                                    "mt-0.5 flex items-center gap-1 text-xs",
                                    isConflict
                                      ? "text-danger-fg font-semibold"
                                      : "text-ink-muted",
                                  )}
                                >
                                  <Coffee className="h-3 w-3" />
                                  Break {formatHM12(s.lunchStart)} –{" "}
                                  {formatHM12(s.lunchEnd)}
                                </p>
                              )}
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {s.signed && (
                                <Badge variant="success" className="gap-1">
                                  <Lock className="h-3 w-3" />
                                  Firmado
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteShift(s.id)}
                            aria-label="Eliminar turno"
                            disabled={s.signed}
                            title={
                              s.signed
                                ? "No se puede eliminar (firmado)"
                                : "Eliminar"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
