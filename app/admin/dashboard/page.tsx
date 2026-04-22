import Link from "next/link";
import { AlertTriangle, Users, ClipboardList, Coins } from "lucide-react";
import { addWeeks } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekEnd, weekStart } from "@/lib/dates";
import { detectConflicts } from "@/lib/conflicts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  await requireAdmin();

  const today = new Date();
  const start = weekStart(today);
  const end = weekEnd(addWeeks(today, 1));

  const [shifts, pendingPto, employeeCount] = await Promise.all([
    prisma.shift.findMany({
      where: { date: { gte: start, lte: end } },
      include: { user: { select: { fullName: true } } },
    }),
    prisma.ptoRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { active: true, role: "EMPLOYEE" } }),
  ]);

  const conflicts = detectConflicts(
    shifts.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user.fullName,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      lunchStart: s.lunchStart,
      lunchEnd: s.lunchEnd,
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="font-display text-2xl font-semibold">
          Panel de Administración
        </h2>
        <p className="text-sm text-ink-muted">
          Vista general de la operación del Casino Atlántico Manatí.
        </p>
      </header>

      {conflicts.length > 0 && (
        <Card className="border-danger bg-danger/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger-fg" />
              <CardTitle className="text-danger-fg">
                {conflicts.length} conflicto(s) de horario detectado(s)
              </CardTitle>
            </div>
            <CardDescription className="text-danger-fg/80">
              Dos o más empleados tienen turnos o almuerzos solapados. Revisa y
              corrige antes de publicar el horario.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {conflicts.slice(0, 10).map((c, i) => (
                <li
                  key={`${c.kind}-${i}`}
                  className="flex items-center gap-3 rounded-lg bg-surface-raised px-3 py-2"
                >
                  <Badge variant={c.kind === "SHIFT" ? "danger" : "warning"}>
                    {c.kind === "SHIFT" ? "Turno" : "Almuerzo"}
                  </Badge>
                  <span className="text-ink">
                    {c.date.toLocaleDateString("es-ES", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    · {c.message}
                  </span>
                </li>
              ))}
            </ul>
            {conflicts.length > 10 && (
              <p className="mt-3 text-xs text-ink-muted">
                … y {conflicts.length - 10} más
              </p>
            )}
            <Link
              href="/admin/schedules"
              className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Ir a horarios →
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/admin/schedules"
          icon={<ClipboardList className="h-5 w-5" />}
          label="Gestionar horarios"
          value={shifts.length.toString()}
          hint="Turnos esta quincena"
        />
        <QuickLink
          href="/admin/employees"
          icon={<Users className="h-5 w-5" />}
          label="Empleados activos"
          value={employeeCount.toString()}
        />
        <QuickLink
          href="/admin/requests"
          icon={<ClipboardList className="h-5 w-5" />}
          label="Solicitudes pendientes"
          value={pendingPto.toString()}
          tone={pendingPto > 0 ? "warning" : undefined}
        />
        <QuickLink
          href="/admin/tips"
          icon={<Coins className="h-5 w-5" />}
          label="Reporte de propinas"
          value="Abrir"
        />
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  value,
  hint,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "warning";
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-border bg-surface-raised p-5 shadow-card transition-all hover:border-brand-200 hover:shadow-soft"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            tone === "warning"
              ? "bg-warning text-warning-fg"
              : "bg-brand-100 text-brand-700"
          }`}
        >
          {icon}
        </span>
      </div>
    </Link>
  );
}
