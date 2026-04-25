import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoMark } from "@/components/logo-mark";
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
    <main className="min-h-screen mesh-bg relative overflow-hidden flex items-start sm:items-center justify-center px-4 py-10 safe-top safe-bottom">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center text-white">
          <LogoMark size={88} className="drop-shadow-lg" />
          <div>
            <h1 className="font-display text-2xl font-bold">
              Horario de Asistentes
            </h1>
            <p className="text-sm text-white/85">Casino Atlántico Manatí</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/40 bg-white/95 p-7 shadow-floating backdrop-blur-md animate-slide-up">
          <h2 className="mb-1 font-display text-lg font-semibold">
            Iniciar sesión
          </h2>
          <p className="mb-5 text-sm text-ink-muted">
            Usa tu usuario y contraseña asignados por el administrador.
          </p>
          <LoginForm redirectTo={params.from} />
        </div>

        <p className="mt-6 text-center text-xs text-white/75">
          ¿Problemas para entrar? Contacta a tu administrador.
        </p>
      </div>
    </main>
  );
}
