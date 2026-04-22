"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SessionPayload } from "@/lib/auth";

export function UserMenu({ session }: { session: SessionPayload }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-ink">{session.fullName}</p>
        <p className="text-xs text-ink-muted capitalize">
          {session.role === "ADMIN" ? "Administrador" : "Empleado"}
        </p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <User className="h-5 w-5" />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        disabled={loading}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
