import Link from "next/link";
import { CalendarClock, CheckCircle2, Coins, Plane } from "lucide-react";
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
import { PendingSignaturesModal } from "./pending-signatures-modal";

export default async function EmployeeDashboard() {
  const session = await requireSession();

  const today = new Date();
  const rangeStart = weekStart(today);
  const rangeEnd = weekEnd(addWeeks(today, 1));

  const [user, shifts, pendingPto] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: {
        vacationHours: true,
        sickHours: true,
        hourlyRate: true,
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
    prisma.ptoRequest.count({
      where: { userId: session.userId, status: "PENDING" },
    }),
  ]);

  const pending = shifts.filter((s) => !s.signature);

  return (
    <div className="flex flex-col gap-6">
      <PendingSignaturesModal
        pending={pending.map((s) => ({
          id: s.id,
          date: s.date.toISOString(),
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
          breakType: s.breakType,
        }))}
      />

      <section>
        <h2 className="font-display text-2xl font-semibold">
          Hola, {session.fullName.split(" ")[0] ?? session.fullName}
        </h2>
        <p className="text-sm text-ink-muted">
          Este es tu panel. Desde aquí puedes firmar tus horarios, solicitar
          tiempo libre y revisar tu balance.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Turnos esta quincena"
          value={shifts.length.toString()}
          hint={`${pending.length} sin firmar`}
          tone={pending.length > 0 ? "warning" : "success"}
        />
        <StatCard
          icon={<Plane className="h-5 w-5" />}
          label="Vacaciones disponibles"
          value={formatHours(Number(user.vacationHours))}
          hint="Acumulas 10h/mes"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Enfermedad disponible"
          value={formatHours(Number(user.sickHours))}
          hint="Acumulas 8h/mes"
        />
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label="Rate por hora"
          value={formatMoney(Number(user.hourlyRate))}
          hint={user.position === "SLOT_ATTENDANT" ? "+ propinas" : undefined}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos turnos</CardTitle>
            <CardDescription>
              Turnos de esta semana y la siguiente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {shifts.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No tienes turnos programados todavía.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {shifts.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {s.date.toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "2-digit",
                          month: "short",
                        })}
                      </p>
                      <p className="text-ink-muted">
                        {s.startTime.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {s.endTime.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {s.signature ? (
                      <Badge variant="success">Firmado</Badge>
                    ) : (
                      <Badge variant="warning">Sin firmar</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes pendientes</CardTitle>
            <CardDescription>
              Estado de tus solicitudes de vacaciones y enfermedad.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm">
              Tienes{" "}
              <span className="font-semibold">{pendingPto}</span> solicitud(es) en
              revisión.
            </p>
            <Link
              href="/employee/requests"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Ver mis solicitudes →
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "warning"
      ? "bg-warning text-warning-fg"
      : tone === "success"
      ? "bg-success text-success-fg"
      : tone === "danger"
      ? "bg-danger text-danger-fg"
      : "bg-brand-100 text-brand-700";
  return (
    <Card className="animate-slide-up">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              {label}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
            {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
          </div>
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}
          >
            {icon}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
