"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RequestActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function act(decision: "APPROVED" | "REJECTED") {
    setLoading(decision === "APPROVED" ? "approve" : "reject");
    try {
      const res = await fetch(`/api/pto/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: decision }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo actualizar la solicitud.");
        return;
      }
      toast.success(
        decision === "APPROVED" ? "Solicitud aprobada ✓" : "Solicitud rechazada",
      );
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="success"
        size="sm"
        onClick={() => act("APPROVED")}
        disabled={loading !== null}
      >
        <Check className="h-4 w-4" />
        Aprobar
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => act("REJECTED")}
        disabled={loading !== null}
      >
        <X className="h-4 w-4" />
        Rechazar
      </Button>
    </div>
  );
}
