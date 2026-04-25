import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { LogoMark } from "@/components/logo-mark";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen mesh-bg relative overflow-hidden flex items-start sm:items-center justify-center px-4 py-10 safe-top safe-bottom">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center text-white">
          <LogoMark size={88} className="drop-shadow-lg" />
          <div>
            <h1 className="font-display text-2xl font-bold">
              Configuración Inicial
            </h1>
            <p className="text-sm text-white/85">Casino Atlántico Manatí</p>
          </div>
        </div>
        <div className="rounded-3xl border border-white/40 bg-white/95 p-7 shadow-floating backdrop-blur-md animate-slide-up">
          <h2 className="mb-1 font-display text-lg font-semibold">
            Crea tu usuario Administrador
          </h2>
          <p className="mb-5 text-sm text-ink-muted">
            Este formulario solo funciona una vez. Luego queda desactivado.
          </p>
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
