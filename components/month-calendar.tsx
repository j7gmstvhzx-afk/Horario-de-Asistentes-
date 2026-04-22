"use client";

import { addMonths, startOfMonth, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toDateString, formatWeekdayShort, formatMonthYear } from "@/lib/dates";
import { cn } from "@/lib/utils";

type MonthCalendarProps = {
  selected: Set<string>; // YYYY-MM-DD strings
  onToggle: (dateStr: string) => void;
  minDate?: Date;
};

export function MonthCalendar({ selected, onToggle, minDate }: MonthCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const firstOfMonth = startOfMonth(month);

  // Align grid start to Monday of the week that contains firstOfMonth.
  const weekdayOfFirst = (firstOfMonth.getDay() + 6) % 7; // Mon=0..Sun=6
  const gridStart = subDays(firstOfMonth, weekdayOfFirst);

  // Always render 6 weeks = 42 days.
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const today = new Date();
  const todayStr = toDateString(today);
  const minStr = minDate ? toDateString(minDate) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-sunken hover:bg-brand-100 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display text-base font-semibold capitalize">
          {formatMonthYear(month)}
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-sunken hover:bg-brand-100 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const dStr = toDateString(d);
          const isCurrentMonth =
            d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
          const isSelected = selected.has(dStr);
          const isToday = dStr === todayStr;
          const disabled = minStr ? dStr < minStr : false;
          return (
            <button
              key={dStr}
              type="button"
              onClick={() => !disabled && onToggle(dStr)}
              disabled={disabled}
              className={cn(
                "aspect-square rounded-xl text-sm font-medium transition-all",
                !isCurrentMonth && "text-ink-faint opacity-40",
                isSelected &&
                  "bg-brand-500 text-white shadow-glow font-semibold scale-[0.98]",
                !isSelected &&
                  isCurrentMonth &&
                  "hover:bg-brand-100 text-ink",
                isToday && !isSelected && "ring-1 ring-brand-300",
                disabled && "cursor-not-allowed opacity-30",
              )}
              aria-pressed={isSelected}
              aria-label={dStr}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ink-muted text-center">
        Toca uno o varios días para crear turnos en lote.
      </p>
    </div>
  );
}

// Re-export helper alias for consumers
export { formatWeekdayShort };
