import { Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatHours } from "@/lib/utils";
import { SimpleHeader } from "@/components/page-header";
import { RequestForm } from "./request-form";
import { CancelRequestButton } from "./cancel-button";

export default async function EmployeeRequestsPage() {
  const session = await requireSession();
  const [user, requests] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { vacationHours: true, sickHours: true },
    }),
    prisma.ptoRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <>
      <SimpleHeader
        title="Solicitudes"
        subtitle="Vacaciones y enfermedad"
      />
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-5 sm:px-5">
        <section className="rounded-2xl border border-border bg-surface-raised p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold">
                Nueva solicitud
              </h2>
              <p className="text-xs text-ink-muted">
                El admin revisa y aprueba.
              </p>
            </div>
          </div>
          <RequestForm
            vacationHours={Number(user.vacationHours)}
            sickHours={Number(user.sickHours)}
          />
        </section>

        <section>
          <h2 className="mb-2 px-1 font-display text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Historial
          </h2>
          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-raised p-8 text-center text-sm text-ink-muted">
              Aún no has hecho solicitudes.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface-raised p-3 shadow-card"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {r.type === "VACATION" ? "Vacaciones" : "Enfermedad"} ·{" "}
                      {formatHours(Number(r.hours))}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {r.startDate.toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      –{" "}
                      {r.endDate.toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {r.reason && (
                      <p className="mt-1 text-xs text-ink-faint">
                        {r.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={r.status} />
                    {r.status === "PENDING" && <CancelRequestButton id={r.id} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function StatusBadge({
  status,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}) {
  switch (status) {
    case "APPROVED":
      return <Badge variant="success">Aprobada</Badge>;
    case "REJECTED":
      return <Badge variant="danger">Rechazada</Badge>;
    case "CANCELLED":
      return <Badge variant="muted">Cancelada</Badge>;
    default:
      return <Badge variant="warning">Pendiente</Badge>;
  }
}
