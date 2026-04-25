"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DayStrip } from "@/components/day-strip";

export function DashboardDayStrip({
  shiftDates,
  todayISO,
}: {
  shiftDates: string[];
  todayISO: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(todayISO);
  return (
    <DayStrip
      shiftDates={new Set(shiftDates)}
      selectedDate={selected}
      onSelect={(d) => {
        setSelected(d);
        router.push(`/employee/day/${d}`);
      }}
      today={new Date(todayISO + "T12:00:00")}
    />
  );
}
