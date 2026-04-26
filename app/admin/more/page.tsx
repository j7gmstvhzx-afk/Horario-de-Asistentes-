import Link from "next/link";
import { ClipboardList, ChevronRight, ClipboardCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { SimpleHeader } from "@/components/page-header";
import { LogoutButton } from "@/components/logout-button";
import { PushToggle } from "@/components/push-prompt";

export default async function AdminMorePage() {
  const session = await requireAdmin();
  return (
    <>
      <SimpleHeader title="Más" subtitle={session.fullName} />
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-5 sm:px-5">
        <section className="rounded-2xl border border-border bg-surface-raised shadow-card divide-y divide-border">
          <MenuLink
            href="/admin/attendance"
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Asistencia"
          />
          <MenuLink
            href="/admin/requests"
            icon={<ClipboardList className="h-5 w-5" />}
            label="Solicitudes PTO"
          />
        </section>
        <PushToggle />
        <LogoutButton variant="secondary" size="lg" className="w-full" />
      </main>
    </>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 transition-colors hover:bg-brand-50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-ink-faint" />
    </Link>
  );
}
