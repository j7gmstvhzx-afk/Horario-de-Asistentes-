"use client";

import { useState } from "react";
import { DayStrip } from "@/components/day-strip";

export function DashboardDayStrip({
  shiftDates,
  todayISO,
}: {
  shiftDates: string[];
  todayISO: string;
}) {
  const [selected, setSelected] = useState(todayISO);
  return (
    <DayStrip
      shiftDates={new Set(shiftDates)}
      selectedDate={selected}
      onSelect={setSelected}
      today={new Date(todayISO + "T12:00:00")}
    />
  );
}
