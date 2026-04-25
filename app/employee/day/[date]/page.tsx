import Link from "next/link";
import { ChevronLeft, Clock, Coffee, Coins } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromDateString, formatDateLongWithYear } from "@/lib/dates";
import {
  formatHM12,
  formatRangeHM12,
  breakTypeLabel,
  breakTypeEmoji,
} from "@/lib/time-format";
import { calculateTips } from "@/lib/tips";
import { weekStart } from "@/lib/dates";
import { SimpleHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatHours } from "@/lib/utils";

const HM_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const session = await requireSession();
  const { date } = await params;
  if (!HM_RE.test(date)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 text-center text-sm text-ink-muted">
        Fecha inválida.
      </main>
    );
  }

  const dateObj = fromDateString(date);

  const [shift, weekReport] = await Promise.all([
    prisma.shift.findFirst({
      where: { userId: session.userId, date: dateObj },
      include: { signature: true },
    }),
    prisma.tipReport.findFirst({
      where: { weekStart: weekStart(dateObj) },
      include: { dailyTips: true, hoursEntries: { include: { user: true } } },
    }),
  ]);

  // Total tip generated that day (raw daily total, not just my share).
  const dailyTipTotal = weekReport?.dailyTips.find(
    (d) => d.date.toISOString().slice(0, 10) === date,
  );

  // My share for that day, if I'm a Slot Attendant in this report.
  let myDayShare: number | null = null;
  let myDayHours: number | null = null;
  if (weekReport) {
    const employees = Array.from(
      new Map(
        weekReport.hoursEntries.map((h) => [
          h.userId,
          {
            userId: h.userId,
            fullName: h.user.fullName,
            hours: {} as Record<string, number>,
          },
        ]),
      ).values(),
    );
    for (const h of weekReport.hoursEntries) {
      const e = employees.find((x) => x.userId === h.userId);
      if (e) e.hours[h.date.toISOString().slice(0, 10)] = Number(h.hours);
    }
    const dailyTips: Record<string, number> = {};
    for (const dt of weekReport.dailyTips) {
      dailyTips[dt.date.toISOString().slice(0, 10)] = Number(dt.totalTip);
    }
    const calc = calculateTips({
      employees,
      dailyTips,
      hourlyRate: Number(weekReport.hourlyRate),
    });
    const meRow = calc.perEmployee.find((e) => e.userId === session.userId);
    if (meRow) {
      const hoursThatDay =
        employees.find((e) => e.userId === session.userId)?.hours[date] ?? 0;
      myDayHours = hoursThatDay;
      myDayShare = hoursThatDay * calc.tipPerHour;
    }
  }

  const breakType = shift?.breakType ?? "NONE";

  return (
    <>
      <SimpleHeader
        title={formatDateLongWithYear(dateObj)}
        right={
          <Link
            href="/employee/dashboard"
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        }
      />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5 sm:px-5">
        {/* Shift card */}
        <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                Tu turno
              </p>
              <p className="font-display text-xl font-bold leading-tight">
                {!shift
                  ? "Sin turno"
                  : breakType !== "NONE"
                  ? `${breakTypeEmoji(breakType)} ${breakTypeLabel(breakType)}`
                  : formatRangeHM12(shift.startTime, shift.endTime)}
              </p>
            </div>
          </div>
          {shift && breakType === "NONE" && shift.lunchStart && shift.lunchEnd && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Coffee className="h-4 w-4" />
              Break {formatHM12(shift.lunchStart)} – {formatHM12(shift.lunchEnd)}
            </p>
          )}
          {shift?.notes && (
            <p className="mt-2 text-xs text-ink-muted">{shift.notes}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {shift?.signature && (
              <Badge variant="success">Firmado</Badge>
            )}
            {!shift?.signature && breakType === "NONE" && shift && (
              <Badge variant="warning">Sin firmar</Badge>
            )}
          </div>
        </section>

        {/* Tips that day */}
        {(dailyTipTotal || myDayShare !== null) && (
          <section className="rounded-3xl border border-border bg-surface-raised p-5 shadow-card">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-brand-700">
                <Coins className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Propinas del día
                </p>
                <p className="font-display text-xl font-bold leading-tight">
                  {formatMoney(Number(dailyTipTotal?.totalTip ?? 0))}
                </p>
                <p className="text-xs text-ink-muted">
                  Total generado por todos los Slot Attendants
                </p>
              </div>
            </div>
            {myDayShare !== null && myDayHours !== null && myDayHours > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-brand-50 p-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    Tus horas
                  </p>
                  <p className="font-display text-base font-bold">
                    {formatHours(myDayHours)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    Tu parte
                  </p>
                  <p className="font-display text-base font-bold text-brand-700">
                    {formatMoney(myDayShare)}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
