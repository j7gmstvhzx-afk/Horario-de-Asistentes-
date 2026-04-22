"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewEmployeeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    password: "",
    position: "SLOT_ATTENDANT",
    hourlyRate: "11.33",
    vacationHours: "10",
    sickHours: "8",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          hourlyRate: Number(form.hourlyRate),
          vacationHours: Number(form.vacationHours),
          sickHours: Number(form.sickHours),
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo crear el empleado.");
        return;
      }
      toast.success("Empleado creado ✓");
      setOpen(false);
      setForm({
        username: "",
        fullName: "",
        password: "",
        position: "SLOT_ATTENDANT",
        hourlyRate: "11.33",
        vacationHours: "10",
        sickHours: "8",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Nuevo empleado</DialogTitle>
          <DialogDescription>
            Define el balance inicial de vacaciones y enfermedad. El empleado
            podrá cambiar su contraseña después de iniciar sesión.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              placeholder="bryan.loran"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="password">Contraseña temporal</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Puesto</Label>
            <Select
              value={form.position}
              onValueChange={(v) => setForm({ ...form, position: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SLOT_ATTENDANT">Slot Attendant</SelectItem>
                <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rate">Rate por hora ($)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vac">Vacaciones iniciales (h)</Label>
            <Input
              id="vac"
              type="number"
              min="0"
              step="0.5"
              value={form.vacationHours}
              onChange={(e) =>
                setForm({ ...form, vacationHours: e.target.value })
              }
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sick">Enfermedad inicial (h)</Label>
            <Input
              id="sick"
              type="number"
              min="0"
              step="0.5"
              value={form.sickHours}
              onChange={(e) => setForm({ ...form, sickHours: e.target.value })}
              required
            />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
