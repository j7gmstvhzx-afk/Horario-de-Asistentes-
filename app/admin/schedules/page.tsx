import { addWeeks } from "date-fns";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd, weekDays, toDateString, nowInCasino } from "@/lib/dates";
import { SimpleHeader } from "@/components/page-header";
import { Fab } from "@/components/floating-action-button";
import { SchedulesList } from "./schedules-editor";

export default async function AdminSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const reference = params.week
    ? new Date(params.week + "T12:00:00")
    : nowInCasino();
  const start = weekStart(reference);
  const end = weekEnd(reference);
  const days = weekDays(reference);

  const [employees, shifts] = await Promise.all([
    prisma.user.findMany({
      where: { active: true, role: "EMPLOYEE" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, position: true },
    }),
    prisma.shift.findMany({
      where: { date: { gte: start, lte: end } },
      include: { signature: true, user: { select: { fullName: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  return (
    <>
      <SimpleHeader title="Horarios" subtitle="Vista semanal" />
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5">
        <SchedulesList
          weekStartStr={toDateString(start)}
          prevWeekStr={toDateString(addWeeks(start, -1))}
          nextWeekStr={toDateString(addWeeks(start, 1))}
          days={days.map((d) => toDateString(d))}
          employees={employees}
          shifts={shifts.map((s) => ({
            id: s.id,
            userId: s.userId,
            userName: s.user.fullName,
            date: toDateString(s.date),
            startTime: s.startTime,
            endTime: s.endTime,
            lunchStart: s.lunchStart,
            lunchEnd: s.lunchEnd,
            breakType: s.breakType,
            notes: s.notes,
            signed: Boolean(s.signature),
          }))}
        />
      </main>
      <Fab href="/admin/schedules/new" label="Nuevo turno">
        <Plus className="h-6 w-6" />
      </Fab>
    </>
  );
}
