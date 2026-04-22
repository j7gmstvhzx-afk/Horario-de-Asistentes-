import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatHours } from "@/lib/utils";
import { SimpleHeader } from "@/components/page-header";
import { RequestActions } from "./request-actions";

export default async function AdminRequestsPage() {
  await requireAdmin();
  const requests = await prisma.ptoRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { fullName: true, vacationHours: true, sickHours: true } },
    },
    take: 100,
  });

  return (
    <>
      <SimpleHeader
        title="Solicitudes PTO"
        subtitle="Aprobar o rechazar"
      />
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-raised p-8 text-center text-sm text-ink-muted">
            No hay solicitudes aún.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{r.user.fullName}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-1 text-sm">
                      {r.type === "VACATION" ? "🏖️ Vacaciones" : "🤒 Enfermedad"} ·{" "}
                      <strong>{formatHours(Number(r.hours))}</strong>
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
                      <p className="mt-1 text-xs text-ink-faint italic">
                        "{r.reason}"
                      </p>
                    )}
                    <p className="mt-1 text-xs text-ink-faint">
                      Balance actual:{" "}
                      {r.type === "VACATION"
                        ? formatHours(Number(r.user.vacationHours))
                        : formatHours(Number(r.user.sickHours))}
                    </p>
                  </div>
                </div>
                {r.status === "PENDING" && (
                  <div className="mt-3 flex justify-end">
                    <RequestActions id={r.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
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
