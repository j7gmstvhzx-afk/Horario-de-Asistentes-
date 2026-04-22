"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="max-w-md rounded-2xl border border-danger bg-danger/20 p-6 text-center shadow-card">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger text-danger-fg">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Algo salió mal
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Ocurrió un error inesperado. Si el problema persiste, contacta al
          administrador.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-ink-faint">Referencia: {error.digest}</p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => reset()}>
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}
