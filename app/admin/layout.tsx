import { redirect } from "next/navigation";
import { Home, Calendar, Users, Coins, MoreHorizontal } from "lucide-react";
import { getSession } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";

const tabs = [
  { href: "/admin/dashboard", label: "Inicio", icon: Home },
  { href: "/admin/schedules", label: "Turnos", icon: Calendar },
  { href: "/admin/employees", label: "Equipo", icon: Users },
  { href: "/admin/tips", label: "Propinas", icon: Coins },
  { href: "/admin/more", label: "Más", icon: MoreHorizontal },
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
      <BottomNav tabs={tabs} />
    </div>
  );
}
