import { addWeeks } from "date-fns";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd, toDateString } from "@/lib/dates";
import { SimpleHeader } from "@/components/page-header";
import { ScheduleList } from "./schedule-table";

export default async function EmployeeSchedulePage() {
  const session = await requireSession();
  const start = weekStart(new Date());
  const end = weekEnd(addWeeks(new Date(), 3));

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
      <SimpleHeader
        title="Mis Horarios"
        subtitle="Revisa y firma tus turnos"
      />
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5">
        <ScheduleList
          shifts={shifts.map((s) => ({
            id: s.id,
            date: toDateString(s.date),
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            lunchStart: s.lunchStart?.toISOString() ?? null,
            lunchEnd: s.lunchEnd?.toISOString() ?? null,
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
