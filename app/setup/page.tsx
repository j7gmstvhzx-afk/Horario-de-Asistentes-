import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LogoMark } from "@/components/logo-mark";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // If an admin already exists, this page is no longer needed.
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-accent-soft px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <LogoMark size={72} />
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold text-ink">
              Configuración Inicial
            </h1>
            <p className="text-sm text-ink-muted">Casino Atlántico Manatí</p>
          </div>
        </div>
        <div className="card-raised p-8 animate-slide-up">
          <h2 className="mb-1 font-display text-lg font-semibold">
            Crea tu usuario Administrador
          </h2>
          <p className="mb-6 text-sm text-ink-muted">
            Este formulario solo funciona una vez. Después de crear el primer
            admin, quedará desactivado automáticamente.
          </p>
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
