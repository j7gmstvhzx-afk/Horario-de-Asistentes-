import { Plane, HeartPulse, Coins } from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, nowInCasino } from "@/lib/dates";
import { addWeeks } from "date-fns";
import { formatMoney, formatHours } from "@/lib/utils";
import { calculateTips } from "@/lib/tips";
import { PageHeader, PageContent } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { LogoutButton } from "@/components/logout-button";

export default async function EmployeeProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
  });

  // Fetch up to last 12 months for monthly history.
  const oneYearAgo = weekStart(addWeeks(nowInCasino(), -52));
  const reports = await prisma.tipReport.findMany({
    where: {
      weekStart: { gte: oneYearAgo },
      hoursEntries: { some: { userId: user.id } },
    },
    include: {
      dailyTips: true,
      hoursEntries: { include: { user: true } },
    },
    orderBy: { weekStart: "desc" },
  });

  const allWeeks = reports.map((report) => {
    const dailyTips: Record<string, number> = {};
    for (const dt of report.dailyTips) {
      dailyTips[dt.date.toISOString().slice(0, 10)] = Number(dt.totalTip);
    }
    const employeesMap = new Map<
      string,
      { userId: string; fullName: string; hours: Record<string, number> }
    >();
    for (const h of report.hoursEntries) {
      const existing = employeesMap.get(h.userId);
      const dateKey = h.date.toISOString().slice(0, 10);
      if (existing) {
        existing.hours[dateKey] = Number(h.hours);
      } else {
        employeesMap.set(h.userId, {
          userId: h.userId,
          fullName: h.user.fullName,
          hours: { [dateKey]: Number(h.hours) },
        });
      }
    }
    const calc = calculateTips({
      employees: Array.from(employeesMap.values()),
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

  // Last 4 weeks detailed.
  const weeklyBreakdown = allWeeks.slice(0, 4);

  // Older weeks aggregated by month YYYY-MM.
  const olderWeeks = allWeeks.slice(4);
  const monthlyMap = new Map<
    string,
    { year: number; month: number; tip: number; total: number; hours: number }
  >();
  for (const w of olderWeeks) {
    const key = `${w.weekStart.getFullYear()}-${String(w.weekStart.getMonth() + 1).padStart(2, "0")}`;
    const prev = monthlyMap.get(key);
    if (prev) {
      prev.tip += w.tip;
      prev.total += w.total;
      prev.hours += w.hours;
    } else {
      monthlyMap.set(key, {
        year: w.weekStart.getFullYear(),
        month: w.weekStart.getMonth(),
        tip: w.tip,
        total: w.total,
        hours: w.hours,
      });
    }
  }
  const monthlyHistory = Array.from(monthlyMap.values()).sort(
    (a, b) => b.year * 12 + b.month - (a.year * 12 + a.month),
  );

  const monthLabel = (year: number, month: number) => {
    const d = new Date(year, month, 1);
    const s = d.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
    return s.replace(/^./, (c) => c.toUpperCase());
  };

  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <PageHeader>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 font-display text-2xl font-bold text-white backdrop-blur">
            {initials}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              {user.fullName}
            </h1>
            <p className="text-sm text-white/80">
              {user.position === "SLOT_ATTENDANT" ? "Slot Attendant" : "Supervisor"}
            </p>
          </div>
        </div>
      </PageHeader>

      <PageContent>
        <div className="flex flex-col gap-4 pb-8">
          <GlassCard className="p-5">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Mis Balances
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <BalanceTile
                icon={<Plane className="h-5 w-5" />}
                label="Vacaciones"
                value={formatHours(Number(user.vacationHours))}
                hint="+10h cada mes"
              />
              <BalanceTile
                icon={<HeartPulse className="h-5 w-5" />}
                label="Enfermedad"
                value={formatHours(Number(user.sickHours))}
                hint="+8h cada mes"
              />
            </div>
          </GlassCard>

          <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-card">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Coins className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Rate por hora
                </p>
                <p className="font-display text-2xl font-bold text-ink">
                  {formatMoney(Number(user.hourlyRate))}
                </p>
              </div>
            </div>
            {user.position === "SLOT_ATTENDANT" && (
              <p className="text-xs text-ink-muted">
                Como Slot Attendant, además del rate recibes tu parte proporcional de propinas de la semana.
              </p>
            )}
          </div>

          {user.position === "SLOT_ATTENDANT" && (
            <>
              <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-card">
                <h3 className="font-display text-base font-semibold">
                  Mis Propinas — Últimas 4 semanas
                </h3>
                {weeklyBreakdown.length === 0 ? (
                  <p className="mt-6 text-center text-sm text-ink-muted">
                    Aún no hay reportes de propinas.
                  </p>
                ) : (
                  <ul className="mt-4 flex flex-col divide-y divide-border">
                    {weeklyBreakdown.map((w) => (
                      <li
                        key={w.weekStart.toISOString()}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {w.weekStart.toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            –{" "}
                            {w.weekEnd.toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {formatHours(w.hours)} · Propina{" "}
                            {formatMoney(w.tip)}
                          </p>
                        </div>
                        <p className="font-display text-lg font-bold text-brand-700">
                          {formatMoney(w.total)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {monthlyHistory.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-card">
                  <h3 className="font-display text-base font-semibold">
                    Histórico mensual
                  </h3>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Totales de meses anteriores.
                  </p>
                  <ul className="mt-4 flex flex-col divide-y divide-border">
                    {monthlyHistory.map((m) => (
                      <li
                        key={`${m.year}-${m.month}`}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {monthLabel(m.year, m.month)}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {formatHours(m.hours)} · Propina{" "}
                            {formatMoney(m.tip)}
                          </p>
                        </div>
                        <p className="font-display text-lg font-bold text-brand-700">
                          {formatMoney(m.total)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <LogoutButton variant="secondary" size="lg" className="w-full" />
          <Link
            href="/employee/dashboard"
            className="text-center text-xs text-ink-faint hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </PageContent>
    </>
  );
}

function BalanceTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-brand-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-brand-700">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-display text-xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{hint}</p>
    </div>
  );
}
