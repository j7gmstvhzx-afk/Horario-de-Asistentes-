import Link from "next/link";
import {
  AlertTriangle,
  Users,
  ClipboardList,
  Coins,
  Calendar,
} from "lucide-react";
import { addWeeks } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { weekEnd, weekStart } from "@/lib/dates";
import { detectBreakConflicts } from "@/lib/conflicts";
import { PageHeader, PageContent } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { GlassCard } from "@/components/glass-card";
import { LogoMark } from "@/components/logo-mark";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const session = await requireAdmin();

  const today = new Date();
  const start = weekStart(today);
  const end = weekEnd(addWeeks(today, 1));

  const [shifts, pendingPto, employeeCount, pendingSignaturesCount] =
    await Promise.all([
      prisma.shift.findMany({
        where: { date: { gte: start, lte: end } },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.ptoRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { active: true, role: "EMPLOYEE" } }),
      prisma.shift.count({
        where: {
          date: { gte: start, lte: end },
          signature: null,
        },
      }),
    ]);

  const conflicts = detectBreakConflicts(
    shifts.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user.fullName,
      date: s.date,
      lunchStart: s.lunchStart,
      lunchEnd: s.lunchEnd,
    })),
  );

  return (
    <>
      <PageHeader>
        <div className="mb-6 flex items-center gap-3">
          <LogoMark size={44} className="drop-shadow" />
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold leading-tight text-white">
              Panel Admin
            </h1>
            <p className="text-sm text-white/85 truncate">
              {session.fullName}
            </p>
          </div>
        </div>
        <p className="text-sm text-white/85">
          Vista general de la operación del Casino Atlántico Manatí.
        </p>
      </PageHeader>

      <PageContent>
        <div className="flex flex-col gap-4 pb-8">
          {conflicts.length > 0 && (
            <GlassCard className="border-danger bg-danger/30 p-5">
              <div className="mb-2 flex items-center gap-2 text-danger-fg">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="font-display text-base font-semibold">
                  {conflicts.length} break{conflicts.length === 1 ? "" : "s"}{" "}
                  solapado{conflicts.length === 1 ? "" : "s"}
                </h2>
              </div>
              <p className="mb-3 text-xs text-danger-fg/90">
                Dos o más empleados tienen el mismo horario de break. Ajusta antes de publicar.
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                {conflicts.slice(0, 5).map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2"
                  >
                    <Badge variant="warning">
                      {c.date.toLocaleDateString("es-ES", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </Badge>
                    <span className="text-ink">{c.message}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/schedules"
                className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
              >
                Ir a horarios →
              </Link>
            </GlassCard>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Calendar}
              label="Turnos 2 semanas"
              value={shifts.length}
            />
            <StatCard
              icon={ClipboardList}
              label="Sin firmar"
              value={pendingSignaturesCount}
              tone={pendingSignaturesCount > 0 ? "warning" : "success"}
            />
            <StatCard
              icon={Users}
              label="Empleados"
              value={employeeCount}
            />
            <StatCard
              icon={ClipboardList}
              label="Solicitudes"
              value={pendingPto}
              tone={pendingPto > 0 ? "warning" : "default"}
            />
          </div>

          <section>
            <h2 className="mb-2 px-1 font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Accesos rápidos
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickLink
                href="/admin/schedules"
                icon={<Calendar className="h-5 w-5" />}
                label="Gestionar horarios"
              />
              <QuickLink
                href="/admin/tips"
                icon={<Coins className="h-5 w-5" />}
                label="Reporte de propinas"
              />
              <QuickLink
                href="/admin/employees"
                icon={<Users className="h-5 w-5" />}
                label="Empleados"
              />
              <QuickLink
                href="/admin/requests"
                icon={<ClipboardList className="h-5 w-5" />}
                label="Aprobar solicitudes"
              />
            </div>
          </section>
        </div>
      </PageContent>
    </>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-4 shadow-card transition-all hover:border-brand-200 hover:shadow-soft"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 group-hover:bg-brand-200">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
