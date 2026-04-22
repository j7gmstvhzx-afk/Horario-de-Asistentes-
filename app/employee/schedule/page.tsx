import { addWeeks } from "date-fns";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd } from "@/lib/dates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScheduleTable } from "./schedule-table";

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
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Mis Horarios</CardTitle>
          <CardDescription>
            Revisa y firma tus turnos. Una vez firmado no puedes modificar la
            firma — contacta al admin si hay errores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleTable
            shifts={shifts.map((s) => ({
              id: s.id,
              date: s.date.toISOString(),
              startTime: s.startTime.toISOString(),
              endTime: s.endTime.toISOString(),
              lunchStart: s.lunchStart ? s.lunchStart.toISOString() : null,
              lunchEnd: s.lunchEnd ? s.lunchEnd.toISOString() : null,
              breakType: s.breakType,
              notes: s.notes,
              signed: Boolean(s.signature),
              signedAt: s.signature?.signedAt.toISOString() ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
