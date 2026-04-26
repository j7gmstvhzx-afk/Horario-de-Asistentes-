import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BottomNav, type TabItem } from "@/components/bottom-nav";
import { PushPrompt } from "@/components/push-prompt";

const tabs: TabItem[] = [
  { href: "/admin/dashboard", label: "Inicio", icon: "home" },
  { href: "/admin/schedules", label: "Turnos", icon: "calendar" },
  { href: "/admin/employees", label: "Equipo", icon: "users" },
  { href: "/admin/tips", label: "Propinas", icon: "coins" },
  { href: "/admin/more", label: "Más", icon: "more" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/employee/dashboard");

  return (
    <div className="min-h-screen bg-surface">
      <div className="pb-tabbar">{children}</div>
      <PushPrompt />
      <BottomNav tabs={tabs} />
    </div>
  );
}
