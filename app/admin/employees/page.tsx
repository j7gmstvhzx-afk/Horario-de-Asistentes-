import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SimpleHeader } from "@/components/page-header";
import { EmployeesTable } from "./employees-table";
import { NewEmployeeButton } from "./new-employee-button";

export default async function AdminEmployeesPage() {
  await requireAdmin();
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: [{ active: "desc" }, { fullName: "asc" }],
  });

  return (
    <>
      <SimpleHeader
        title="Equipo"
        subtitle={`${employees.length} empleados`}
        right={<NewEmployeeButton />}
      />
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5">
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
      </main>
    </>
  );
}
