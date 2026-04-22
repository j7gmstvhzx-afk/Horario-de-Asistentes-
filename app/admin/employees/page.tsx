import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmployeesTable } from "./employees-table";
import { NewEmployeeButton } from "./new-employee-button";

export default async function AdminEmployeesPage() {
  await requireAdmin();
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: [{ active: "desc" }, { fullName: "asc" }],
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Empleados</CardTitle>
            <CardDescription>
              Administra usuarios, balances iniciales y rates por hora.
            </CardDescription>
          </div>
          <NewEmployeeButton />
        </div>
      </CardHeader>
      <CardContent>
        <EmployeesTable
          employees={employees.map((e) => ({
            id: e.id,
            username: e.username,
            fullName: e.fullName,
            position: e.position,
            active: e.active,
            hourlyRate: Number(e.hourlyRate),
            vacationHours: Number(e.vacationHours),
            sickHours: Number(e.sickHours),
          }))}
        />
      </CardContent>
    </Card>
  );
}
