import Link from "next/link";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { formatMonthYear } from "@/lib/dates";
import type { SessionPayload } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  session: SessionPayload;
  referenceDate?: Date;
  className?: string;
};

export function AppHeader({
  session,
  referenceDate = new Date(),
  className,
}: AppHeaderProps) {
  const monthYear = formatMonthYear(referenceDate);
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-surface-raised/90 backdrop-blur",
        className,
      )}
    >
      <div className="container mx-auto flex flex-col items-center gap-3 py-3 sm:flex-row sm:gap-6 sm:py-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
        </Link>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="font-display text-lg font-semibold leading-tight text-ink sm:text-xl">
            Horario de Asistentes
          </h1>
          <p className="text-xs text-ink-muted sm:text-sm">
            Casino Atlántico Manatí · {monthYear}
          </p>
        </div>
        <Nav role={session.role} />
        <UserMenu session={session} />
      </div>
    </header>
  );
}

function Nav({ role }: { role: SessionPayload["role"] }) {
  const employeeLinks = [
    { href: "/employee/dashboard", label: "Inicio" },
    { href: "/employee/schedule", label: "Horarios" },
    { href: "/employee/requests", label: "Solicitudes" },
    { href: "/employee/profile", label: "Perfil" },
  ];
  const adminLinks = [
    { href: "/admin/dashboard", label: "Inicio" },
    { href: "/admin/schedules", label: "Horarios" },
    { href: "/admin/employees", label: "Empleados" },
    { href: "/admin/tips", label: "Propinas" },
    { href: "/admin/requests", label: "Solicitudes" },
  ];
  const links = role === "ADMIN" ? adminLinks : employeeLinks;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg px-3 py-1.5 text-ink-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
