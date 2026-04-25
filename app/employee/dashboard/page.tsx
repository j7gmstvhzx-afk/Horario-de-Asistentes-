import Link from "next/link";
import { Clock, Coffee, CheckCircle2, AlertCircle } from "lucide-react";
import { addWeeks } from "date-fns";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekStart, weekEnd, toDateString } from "@/lib/dates";
import { formatHM12, formatRangeHM12 } from "@/lib/time-format";
import { PageHeader, PageContent } from "@/components/page-header";
import { Greeting } from "@/components/greeting";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/logo-mark";
import { PendingSignaturesModal } from "./pending-signatures-modal";
import { DashboardDayStrip } from "./dashboard-day-strip";

export default async function EmployeeDashboard() {
  const session = await requireSession();
  const today = new Date();
  const rangeStart = weekStart(today);
  const rangeEnd = weekEnd(addWeeks(today, 1));

  const [user, shifts] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: {
        fullName: true,
        hourlyRate: true,
        vacationHours: true,
        sickHours: true,
        position: true,
      },
    }),
    prisma.shift.findMany({
      where: {
        userId: session.userId,
        date: { gte: rangeStart, lte: rangeEnd },
      },
      include: { signature: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const shiftsByDate = new Map<string, (typeof shifts)[number]>();
  for (const s of shifts) {
    shiftsByDate.set(toDateString(s.date), s);
  }
  const shiftDates = new Set(shiftsByDate.keys());
  const pending = shifts.filter((s) => !s.signature);

  return (
    <>
      <PendingSignaturesModal
        pending={pending.map((s) => ({
          id: s.id,
          date: toDateString(s.date),
          startTime: s.startTime,
          endTime: s.endTime,
          breakType: s.breakType,
        }))}
      />

      <PageHeader>
        <div className="mb-6 flex items-center justify-between">
          <LogoMark size={44} className="drop-shadow" />
        </div>
        <Greeting name={user.fullName} />
        <div className="mt-6">
          <DashboardDayStrip
            shiftDates={Array.from(shiftDates)}
            todayISO={toDateString(today)}
          />
        </div>
      </PageHeader>

      <PageContent>
        <section className="flex flex-col gap-4 pb-8">
          <TodayShiftCard
            shift={shiftsByDate.get(toDateString(today))}
            todayISO={toDateString(today)}
          />

          <UpcomingShifts
            shifts={shifts
              .filter((s) => toDateString(s.date) > toDateString(today))
              .map((s) => ({
                id: s.id,
                date: toDateString(s.date),
                startTime: s.startTime,
                endTime: s.endTime,
                signed: Boolean(s.signature),
                breakType: s.breakType,
              }))}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <BalanceCard
              label="Vacaciones"
              hours={Number(user.vacationHours)}
            />
            <BalanceCard label="Enfermedad" hours={Number(user.sickHours)} />
          </div>
        </section>
      </PageContent>
    </>
  );
}

function TodayShiftCard({
  shift,
  todayISO,
}: {
  shift:
    | {
        startTime: string;
        endTime: string;
        lunchStart: string | null;
        lunchEnd: string | null;
        signature: { signedAt: Date } | null;
        breakType: "NONE" | "VACATION" | "SICK" | "PERSONAL";
      }
    | undefined;
  todayISO: string;
}) {
  if (!shift) {
    return (
      <GlassCard className="p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-brand-600">
          Hoy ·{" "}
          {new Date(todayISO + "T12:00:00").toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "short",
          })}
        </p>
        <p className="mt-2 font-display text-lg font-semibold">
          No tienes turno hoy
        </p>
        <p className="text-sm text-ink-muted">Descansa 🏖️</p>
      </GlassCard>
    );
  }
  const signed = Boolean(shift.signature);
  const isBreak = shift.breakType !== "NONE";
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
          <Clock className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Tu turno de hoy
          </p>
          <p className="font-display text-[28px] font-bold leading-tight text-ink">
            {formatRangeHM12(shift.startTime, shift.endTime)}
          </p>
          {shift.lunchStart && shift.lunchEnd && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
              <Coffee className="h-3.5 w-3.5" />
              Break {formatRangeHM12(shift.lunchStart, shift.lunchEnd)}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isBreak ? (
          <Badge
            variant={
              shift.breakType === "VACATION"
                ? "success"
                : shift.breakType === "SICK"
                ? "warning"
                : "muted"
            }
          >
            {shift.breakType === "VACATION"
              ? "Vacaciones"
              : shift.breakType === "SICK"
              ? "Enfermedad"
              : "Personal"}
          </Badge>
        ) : signed ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Firmado
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Sin firmar
          </Badge>
        )}
        {!signed && !isBreak && (
          <Link
            href="/employee/schedule"
            className="ml-auto inline-flex h-10 items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-medium text-white shadow-card transition-all hover:bg-brand-600 active:scale-[0.98]"
          >
            Firmar turno
          </Link>
        )}
      </div>
    </GlassCard>
  );
}

function UpcomingShifts({
  shifts,
}: {
  shifts: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    signed: boolean;
    breakType: "NONE" | "VACATION" | "SICK" | "PERSONAL";
  }[];
}) {
  if (shifts.length === 0) return null;
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
          Próximos turnos
        </h2>
        <Link
          href="/employee/schedule"
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Ver todos
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {shifts.slice(0, 4).map((s) => {
          const d = new Date(s.date + "T12:00:00");
          return (
            <li key={s.id}>
              <Link
                href="/employee/schedule"
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-3 shadow-card transition-all hover:border-brand-200 hover:shadow-soft"
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <span className="text-[10px] font-semibold uppercase leading-none">
                    {d
                      .toLocaleDateString("es-ES", { month: "short" })
                      .replace(".", "")}
                  </span>
                  <span className="font-display text-lg font-bold leading-none">
                    {d.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">
                    {d.toLocaleDateString("es-ES", { weekday: "long" })}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-muted">
                    <Clock className="h-3 w-3" />
                    {formatHM12(s.startTime)} – {formatHM12(s.endTime)}
                  </p>
                </div>
                {s.breakType !== "NONE" ? (
                  <Badge
                    variant={
                      s.breakType === "VACATION"
                        ? "success"
                        : s.breakType === "SICK"
                        ? "warning"
                        : "muted"
                    }
                  >
                    {s.breakType === "VACATION"
                      ? "Vac."
                      : s.breakType === "SICK"
                      ? "Enf."
                      : "Pers."}
                  </Badge>
                ) : s.signed ? (
                  <Badge variant="success">Firmado</Badge>
                ) : (
                  <Badge variant="warning">Pendiente</Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function BalanceCard({ label, hours }: { label: string; hours: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">
        {hours.toFixed(hours % 1 === 0 ? 0 : 1)}h
      </p>
      <p className="text-xs text-ink-faint">disponibles</p>
    </div>
  );
}
