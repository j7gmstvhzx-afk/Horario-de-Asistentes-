import { redirect } from "next/navigation";
import { Home, Calendar, FileText, User } from "lucide-react";
import { getSession } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";

const tabs = [
  { href: "/employee/dashboard", label: "Inicio", icon: Home },
  { href: "/employee/schedule", label: "Turnos", icon: Calendar },
  { href: "/employee/requests", label: "Solicitudes", icon: FileText },
  { href: "/employee/profile", label: "Perfil", icon: User },
];

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      <div className="pb-tabbar">{children}</div>
      <BottomNav tabs={tabs} />
    </div>
  );
}
