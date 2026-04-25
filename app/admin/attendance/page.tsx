import { addWeeks } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd, toDateString, formatDateWithYear } from "@/lib/dates";
import { SimpleHeader } from "@/components/page-header";
import { AttendanceList } from "./attendance-list";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const reference = params.week
    ? new Date(params.week + "T12:00:00")
    : new Date();
  const start = weekStart(reference);
  const end = weekEnd(reference);

  const shifts = await prisma.shift.findMany({
    where: { date: { gte: start, lte: end }, breakType: "NONE" },
    include: {
      user: { select: { fullName: true } },
      attendance: true,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return (
    <>
      <SimpleHeader title="Asistencia" subtitle="Tardanzas y ausencias" />
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5">
        <AttendanceList
          weekStartStr={toDateString(start)}
          prevWeekStr={toDateString(addWeeks(start, -1))}
          nextWeekStr={toDateString(addWeeks(start, 1))}
          shifts={shifts.map((s) => ({
            id: s.id,
            userName: s.user.fullName,
            date: toDateString(s.date),
            startTime: s.startTime,
            endTime: s.endTime,
            attendance: s.attendance
              ? {
                  status: s.attendance.status,
                  minutesLate: s.attendance.minutesLate,
                  clockIn: s.attendance.clockIn?.toISOString() ?? null,
                  clockOut: s.attendance.clockOut?.toISOString() ?? null,
                  notes: s.attendance.notes,
                }
              : null,
          }))}
        />
      </main>
    </>
  );
}

// Re-export for SimpleHeader formatter use (kept for tree-shaking visibility).
export { formatDateWithYear };
