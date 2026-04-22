import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd, weekDays } from "@/lib/dates";
import { addWeeks } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TipsEditor } from "./tips-editor";

export default async function AdminTipsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const reference = params.week ? new Date(params.week) : new Date();
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
      const dayKey = h.date.toISOString().slice(0, 10);
      const prev = hoursMap.get(key) ?? {};
      prev[dayKey] = Number(h.hours);
      hoursMap.set(key, prev);
    }
  }

  const dailyTips: Record<string, number> = {};
  if (existing) {
    for (const dt of existing.dailyTips) {
      dailyTips[dt.date.toISOString().slice(0, 10)] = Number(dt.totalTip);
    }
  }

  const employees = slotAttendants.map((s) => ({
    userId: s.id,
    fullName: s.fullName,
    hours: hoursMap.get(s.id) ?? {},
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slot Attendant Tip Report</CardTitle>
        <CardDescription>
          Replica la hoja de cálculo semanal. Ingresa horas trabajadas y propinas
          por día; los cálculos se actualizan automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TipsEditor
          key={`${start.toISOString()}-${existing?.id ?? "new"}`}
          weekStartIso={start.toISOString()}
          weekEndIso={end.toISOString()}
          prevWeekIso={addWeeks(start, -1).toISOString()}
          nextWeekIso={addWeeks(start, 1).toISOString()}
          days={days.map((d) => d.toISOString())}
          employees={employees}
          dailyTips={dailyTips}
          hourlyRate={hourlyRate}
          preparedBy={existing?.preparedBy ?? admin.fullName}
          existingReportId={existing?.id ?? null}
        />
      </CardContent>
    </Card>
  );
}
