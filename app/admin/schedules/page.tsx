import { addWeeks } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd, weekDays } from "@/lib/dates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SchedulesEditor } from "./schedules-editor";

export default async function AdminSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const reference = params.week ? new Date(params.week) : new Date();
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
      include: { signature: true },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Horarios</CardTitle>
        <CardDescription>
          Crea y edita turnos. El sistema detecta conflictos automáticamente
          (turnos y almuerzos solapados).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SchedulesEditor
          key={start.toISOString()}
          weekStartIso={start.toISOString()}
          days={days.map((d) => d.toISOString())}
          employees={employees}
          nextWeekIso={addWeeks(start, 1).toISOString()}
          prevWeekIso={addWeeks(start, -1).toISOString()}
          shifts={shifts.map((s) => ({
            id: s.id,
            userId: s.userId,
            date: s.date.toISOString(),
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
            lunchStart: s.lunchStart?.toISOString() ?? null,
            lunchEnd: s.lunchEnd?.toISOString() ?? null,
            breakType: s.breakType,
            notes: s.notes,
            signed: Boolean(s.signature),
          }))}
        />
      </CardContent>
    </Card>
  );
}
