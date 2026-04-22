import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <LogoMark size={72} />
      <h1 className="font-display text-3xl font-semibold">404</h1>
      <p className="text-sm text-ink-muted">
        La página que buscas no existe o fue movida.
      </p>
      <Link href="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
