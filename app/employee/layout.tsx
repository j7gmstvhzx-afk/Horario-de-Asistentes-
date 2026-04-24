import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BottomNav, type TabItem } from "@/components/bottom-nav";

const tabs: TabItem[] = [
  { href: "/employee/dashboard", label: "Inicio", icon: "home" },
  { href: "/employee/schedule", label: "Turnos", icon: "calendar" },
  { href: "/employee/requests", label: "Solicitudes", icon: "file" },
  { href: "/employee/profile", label: "Perfil", icon: "user" },
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
