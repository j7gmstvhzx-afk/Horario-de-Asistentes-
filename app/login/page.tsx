import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect(
      session.role === "ADMIN" ? "/admin/dashboard" : "/employee/dashboard",
    );
  }

  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-accent-soft px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size="lg" showName={false} />
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold text-ink">
              Horario de Asistentes
            </h1>
            <p className="text-sm text-ink-muted">Casino Atlántico Manatí</p>
          </div>
        </div>
        <div className="card-raised p-8 animate-slide-up">
          <h2 className="mb-1 font-display text-lg font-semibold">Iniciar sesión</h2>
          <p className="mb-6 text-sm text-ink-muted">
            Usa tu usuario y contraseña asignados por el administrador.
          </p>
          <LoginForm redirectTo={params.from} />
        </div>
        <p className="mt-6 text-center text-xs text-ink-muted">
          ¿Problemas para entrar? Contacta a tu administrador.
        </p>
      </div>
    </main>
  );
}
