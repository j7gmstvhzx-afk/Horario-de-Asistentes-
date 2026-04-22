import { LogoMark } from "@/components/logo-mark";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
      <div className="animate-pulse">
        <LogoMark size={72} />
      </div>
      <p className="text-sm text-ink-muted">Cargando…</p>
    </div>
  );
}
