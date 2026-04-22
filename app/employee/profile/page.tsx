import { Plane, HeartPulse, Coins, Clock } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd } from "@/lib/dates";
import { addWeeks } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatHours, formatMoney } from "@/lib/utils";
import { calculateTips } from "@/lib/tips";

export default async function EmployeeProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
  });

  // Pull tip reports where this user worked (last 8 weeks)
  const startRange = weekStart(addWeeks(new Date(), -8));
  const reports = await prisma.tipReport.findMany({
    where: {
      weekStart: { gte: startRange },
      hoursEntries: { some: { userId: user.id } },
    },
    include: {
      dailyTips: true,
      hoursEntries: { include: { user: true } },
    },
    orderBy: { weekStart: "desc" },
  });

  const weeklyBreakdown = reports.map((report) => {
    const dailyTips: Record<string, number> = {};
    for (const dt of report.dailyTips) {
      dailyTips[dt.date.toISOString().slice(0, 10)] = Number(dt.totalTip);
    }
    const employees = Array.from(
      new Map(
        report.hoursEntries.map((h) => [
          h.userId,
          {
            userId: h.userId,
            fullName: h.user.fullName,
            hours: {} as Record<string, number>,
          },
        ]),
      ).values(),
    );
    for (const h of report.hoursEntries) {
      const emp = employees.find((e) => e.userId === h.userId);
      if (emp) {
        emp.hours[h.date.toISOString().slice(0, 10)] = Number(h.hours);
      }
    }
    const calc = calculateTips({
      employees,
      dailyTips,
      hourlyRate: Number(report.hourlyRate),
    });
    const mine = calc.perEmployee.find((e) => e.userId === user.id);
    return {
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      hours: mine?.hoursWorked ?? 0,
      tip: mine?.tipEarned ?? 0,
      total: mine?.totalComp ?? 0,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-semibold">Mi Perfil</h2>
        <p className="text-sm text-ink-muted">
          {user.fullName} · {user.position === "SLOT_ATTENDANT"
            ? "Slot Attendant"
            : "Supervisor"}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          icon={<Plane className="h-5 w-5" />}
          label="Vacaciones"
          value={formatHours(Number(user.vacationHours))}
          hint="Acumulas 10h al mes"
        />
        <BalanceCard
          icon={<HeartPulse className="h-5 w-5" />}
          label="Enfermedad"
          value={formatHours(Number(user.sickHours))}
          hint="Acumulas 8h al mes"
        />
        <BalanceCard
          icon={<Coins className="h-5 w-5" />}
          label="Rate por hora"
          value={formatMoney(Number(user.hourlyRate))}
        />
        <BalanceCard
          icon={<Clock className="h-5 w-5" />}
          label="Miembro desde"
          value={user.createdAt.toLocaleDateString("es-ES", {
            month: "short",
            year: "numeric",
          })}
        />
      </section>

      {user.position === "SLOT_ATTENDANT" && (
        <Card>
          <CardHeader>
            <CardTitle>Mis Propinas</CardTitle>
            <CardDescription>
              Reporte de propinas por semana según el Slot Attendant Tip Report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyBreakdown.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                Aún no hay reportes de propinas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-ink-muted">
                      <th className="px-3 py-2 text-left">Semana</th>
                      <th className="px-3 py-2 text-right">Horas</th>
                      <th className="px-3 py-2 text-right">Propinas</th>
                      <th className="px-3 py-2 text-right">Propinas + Salario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyBreakdown.map((w) => (
                      <tr
                        key={w.weekStart.toISOString()}
                        className="border-t border-border"
                      >
                        <td className="px-3 py-2">
                          {w.weekStart.toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          –{" "}
                          {w.weekEnd.toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatHours(w.hours)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatMoney(w.tip)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-brand-700">
                          {formatMoney(w.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BalanceCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              {label}
            </p>
            <p className="mt-1 font-display text-xl font-semibold">{value}</p>
            {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            {icon}
          </span>
        </div>
        {label === "Vacaciones" && <Badge className="mt-3">Disponible</Badge>}
      </CardContent>
    </Card>
  );
}
