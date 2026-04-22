"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CancelRequestButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pto/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo cancelar la solicitud.");
        return;
      }
      toast.success("Solicitud cancelada.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={cancel} disabled={loading}>
      <X className="h-3.5 w-3.5" />
      Cancelar
    </Button>
  );
}
