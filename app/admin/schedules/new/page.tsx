import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SimpleHeader } from "@/components/page-header";
import { NewShiftFlow } from "./new-shift-flow";

export default async function NewShiftPage() {
  await requireAdmin();
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, position: true },
  });
  return (
    <>
      <SimpleHeader
        title="Nuevo turno"
        subtitle="Flujo rápido"
        right={
          <Link
            href="/admin/schedules"
            aria-label="Volver"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        }
      />
      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5">
        <NewShiftFlow employees={employees} />
      </main>
    </>
  );
}
