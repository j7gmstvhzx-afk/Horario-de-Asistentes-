import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

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
      <AppHeader session={session} />
      <main className="container mx-auto py-6">{children}</main>
    </div>
  );
}
