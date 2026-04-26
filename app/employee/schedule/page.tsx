import { addWeeks } from "date-fns";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd, toDateString, nowInCasino } from "@/lib/dates";
import { SimpleHeader } from "@/components/page-header";
import { ScheduleList } from "./schedule-table";

export default async function EmployeeSchedulePage() {
  const session = await requireSession();
  const now = nowInCasino();
  const start = weekStart(now);
  const end = weekEnd(addWeeks(now, 3));

  const shifts = await prisma.shift.findMany({
    where: {
      userId: session.userId,
      date: { gte: start, lte: end },
    },
    include: { signature: true },
    orderBy: { date: "asc" },
  });

  return (
    <>
      <SimpleHeader title="Mis Horarios" subtitle="Revisa y firma tus turnos" />
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5">
        <ScheduleList
          shifts={shifts.map((s) => ({
            id: s.id,
            date: toDateString(s.date),
            startTime: s.startTime,
            endTime: s.endTime,
            lunchStart: s.lunchStart,
            lunchEnd: s.lunchEnd,
            breakType: s.breakType,
            notes: s.notes,
            signed: Boolean(s.signature),
            signedAt: s.signature?.signedAt.toISOString() ?? null,
          }))}
        />
      </main>
    </>
  );
}
