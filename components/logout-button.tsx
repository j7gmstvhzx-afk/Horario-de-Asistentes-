"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function LogoutButton(props: Omit<ButtonProps, "onClick" | "children">) {
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
    <Button {...props} onClick={logout} disabled={loading || props.disabled}>
      <LogOut className="h-4 w-4" />
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </Button>
  );
}
