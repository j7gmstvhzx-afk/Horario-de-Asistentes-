import { requireSession } from "@/lib/auth";
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
import { RequestForm } from "./request-form";

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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva solicitud</CardTitle>
          <CardDescription>
            Solicita tiempo de vacaciones o enfermedad. El administrador revisará
            y aprobará o rechazará la solicitud.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestForm
            vacationHours={Number(user.vacationHours)}
            sickHours={Number(user.sickHours)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis solicitudes</CardTitle>
          <CardDescription>Historial de solicitudes recientes.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              Aún no has hecho solicitudes.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
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
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
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
