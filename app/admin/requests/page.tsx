import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatHours } from "@/lib/utils";
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
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes de tiempo libre</CardTitle>
        <CardDescription>
          Aprueba o rechaza solicitudes. Al aprobar se descuenta del balance del
          empleado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            No hay solicitudes aún.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium">
                    {r.user.fullName} ·{" "}
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
                    {r.reason ? ` · ${r.reason}` : null}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Balance actual:{" "}
                    {r.type === "VACATION"
                      ? formatHours(Number(r.user.vacationHours))
                      : formatHours(Number(r.user.sickHours))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.status === "PENDING" && <RequestActions id={r.id} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
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
