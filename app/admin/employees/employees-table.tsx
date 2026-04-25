"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plane, HeartPulse, Coins } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatHours, formatMoney } from "@/lib/utils";

type Employee = {
  id: string;
  username: string;
  fullName: string;
  position: "SLOT_ATTENDANT" | "SUPERVISOR";
  active: boolean;
  hourlyRate: number;
  vacationHours: number;
  sickHours: number;
};

export function EmployeesTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-raised p-8 text-center">
        <p className="text-sm font-medium">Aún no hay empleados</p>
        <p className="text-xs text-ink-muted">
          Crea el primero con el botón de arriba.
        </p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {employees.map((e) => {
        const initials = e.fullName
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <li
            key={e.id}
            className="rounded-2xl border border-border bg-surface-raised p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-base font-bold text-brand-700">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{e.fullName}</p>
                  {e.active ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="muted">Inactivo</Badge>
                  )}
                </div>
                <p className="text-xs text-ink-muted">
                  @{e.username} ·{" "}
                  {e.position === "SLOT_ATTENDANT"
                    ? "Slot Attendant"
                    : "Supervisor"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-brand-700">
                    <Coins className="h-3 w-3" />
                    {formatMoney(e.hourlyRate)}/h
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-success/50 px-2 py-1 text-success-fg">
                    <Plane className="h-3 w-3" />
                    {formatHours(e.vacationHours)}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-warning/50 px-2 py-1 text-warning-fg">
                    <HeartPulse className="h-3 w-3" />
                    {formatHours(e.sickHours)}
                  </span>
                  <EditBalance employee={e} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function EditBalance({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [vacation, setVacation] = useState(employee.vacationHours.toString());
  const [sick, setSick] = useState(employee.sickHours.toString());
  const [rate, setRate] = useState(employee.hourlyRate.toString());
  const [reason, setReason] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vacationHours: Number(vacation),
          sickHours: Number(sick),
          hourlyRate: Number(rate),
          reason: reason || undefined,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo actualizar.");
        return;
      }
      toast.success("Actualizado ✓");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast.error("Mínimo 8 caracteres.");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/password`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo cambiar la contraseña.");
        return;
      }
      toast.success("Contraseña actualizada ✓");
      setNewPassword("");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="ml-auto flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {employee.fullName}</DialogTitle>
          <DialogDescription>
            Ajusta balance y rate por hora. Los cambios quedan auditados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vac">Vacaciones (h)</Label>
              <Input
                id="vac"
                type="number"
                step="0.5"
                min="0"
                value={vacation}
                onChange={(e) => setVacation(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sick">Enfermedad (h)</Label>
              <Input
                id="sick"
                type="number"
                step="0.5"
                min="0"
                value={sick}
                onChange={(e) => setSick(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rate">Rate ($/h)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Motivo del ajuste</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: ajuste inicial, corrección"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>

        <div className="mt-6 border-t border-border pt-4">
          <h3 className="font-display text-sm font-semibold">
            Cambiar contraseña
          </h3>
          <p className="mb-3 text-xs text-ink-muted">
            Útil si el empleado la olvidó. Mínimo 8 caracteres.
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="newpw" className="sr-only">
                Nueva contraseña
              </Label>
              <Input
                id="newpw"
                type="text"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={changePassword}
              disabled={pwLoading || newPassword.length < 8}
            >
              {pwLoading ? "…" : "Cambiar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
