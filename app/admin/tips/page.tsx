import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd, weekDays, toDateString, nowInCasino } from "@/lib/dates";
import { addWeeks } from "date-fns";
import { SimpleHeader } from "@/components/page-header";
import { TipsEditor } from "./tips-editor";

export default async function AdminTipsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const reference = params.week
    ? new Date(params.week + "T12:00:00")
    : nowInCasino();
  const start = weekStart(reference);
  const end = weekEnd(reference);
  const days = weekDays(reference);

  const [slotAttendants, existing] = await Promise.all([
    prisma.user.findMany({
      where: { role: "EMPLOYEE", position: "SLOT_ATTENDANT", active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, hourlyRate: true },
    }),
    prisma.tipReport.findUnique({
      where: { weekStart: start },
      include: { dailyTips: true, hoursEntries: true },
    }),
  ]);

  const hourlyRate =
    existing?.hourlyRate !== undefined
      ? Number(existing.hourlyRate)
      : slotAttendants.length > 0
      ? Number(slotAttendants[0]?.hourlyRate ?? 11.33)
      : 11.33;

  const hoursMap = new Map<string, Record<string, number>>();
  if (existing) {
    for (const h of existing.hoursEntries) {
      const key = h.userId;
      const dayKey = toDateString(h.date);
      const prev = hoursMap.get(key) ?? {};
      prev[dayKey] = Number(h.hours);
      hoursMap.set(key, prev);
    }
  }

  const dailyTips: Record<string, number> = {};
  if (existing) {
    for (const dt of existing.dailyTips) {
      dailyTips[toDateString(dt.date)] = Number(dt.totalTip);
    }
  }

  const employees = slotAttendants.map((s) => ({
    userId: s.id,
    fullName: s.fullName,
    hours: hoursMap.get(s.id) ?? {},
  }));

  return (
    <>
      <SimpleHeader
        title="Reporte de Propinas"
        subtitle="Slot Attendants"
      />
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-5">
        <TipsEditor
          key={`${toDateString(start)}-${existing?.id ?? "new"}`}
          weekStartStr={toDateString(start)}
          weekEndStr={toDateString(end)}
          prevWeekStr={toDateString(addWeeks(start, -1))}
          nextWeekStr={toDateString(addWeeks(start, 1))}
          days={days.map((d) => toDateString(d))}
          employees={employees}
          dailyTips={dailyTips}
          hourlyRate={hourlyRate}
          preparedBy={existing?.preparedBy ?? admin.fullName}
        />
      </main>
    </>
  );
}
