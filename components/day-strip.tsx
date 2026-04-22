"use client";

import { addWeeks } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { weekDays, weekStart, formatWeekdayShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

type DayStripProps = {
  /** Set of ISO date strings (YYYY-MM-DD) that have shifts. */
  shiftDates: Set<string>;
  selectedDate: string;
  onSelect: (dateStr: string) => void;
  today: Date;
};

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DayStrip({ shiftDates, selectedDate, onSelect, today }: DayStripProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const referenceDate = addWeeks(today, weekOffset);
  const start = weekStart(referenceDate);
  const days = weekDays(referenceDate);
  const todayStr = toDateStr(today);

  const rangeStart = start.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
  const rangeEnd = days[6]!.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-white/90">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium tracking-wide">
          {rangeStart} – {rangeEnd}
        </p>
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const dStr = toDateStr(d);
          const isSelected = dStr === selectedDate;
          const isToday = dStr === todayStr;
          const hasShift = shiftDates.has(dStr);
          return (
            <button
              key={dStr}
              type="button"
              onClick={() => onSelect(dStr)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-2 transition-all",
                isSelected
                  ? "bg-white text-brand-700 shadow-card"
                  : "bg-white/15 text-white hover:bg-white/25",
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                {formatWeekdayShort(d)}
              </span>
              <span
                className={cn(
                  "text-lg font-bold leading-none",
                  isToday && !isSelected && "underline decoration-2",
                )}
              >
                {d.getDate()}
              </span>
              <span
                className={cn(
                  "h-1 w-1 rounded-full transition-all",
                  hasShift ? (isSelected ? "bg-brand-500" : "bg-white") : "bg-transparent",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
