"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupForm() {
  const router = useRouter();
  const [setupToken, setSetupToken] = useState("");
  const [username, setUsername] = useState("admin");
  const [fullName, setFullName] = useState("Administrador");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-setup-token": setupToken.trim(),
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          fullName: fullName.trim(),
          password,
        }),
      });
      const body = (await res.json()) as
        | { ok: true; data: { username: string } }
        | { ok: false; error: string };

      if (!body.ok) {
        toast.error(body.error);
        return;
      }

      toast.success("¡Administrador creado! Ya puedes iniciar sesión.");
      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1200);
    } catch {
      toast.error("No se pudo crear el administrador. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="setupToken">Setup Token</Label>
        <Input
          id="setupToken"
          value={setupToken}
          onChange={(e) => setSetupToken(e.target.value)}
          required
          autoComplete="off"
          placeholder="Pega el valor de SETUP_TOKEN"
        />
        <p className="text-xs text-ink-muted">
          Es el valor de la variable <code>SETUP_TOKEN</code> que definiste en
          Vercel.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Usuario</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          pattern="[a-z0-9._-]+"
          placeholder="admin"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="text-xs text-ink-muted">Mínimo 8 caracteres.</p>
      </div>
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Creando…" : "Crear administrador"}
      </Button>
    </form>
  );
}
