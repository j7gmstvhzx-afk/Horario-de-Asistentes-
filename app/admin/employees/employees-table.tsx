"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
      <p className="py-8 text-center text-sm text-ink-muted">
        Aún no hay empleados. Crea el primero con el botón "Nuevo empleado".
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="bg-surface-sunken text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="rounded-l-xl px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Usuario</th>
            <th className="px-4 py-3">Puesto</th>
            <th className="px-4 py-3 text-right">Rate</th>
            <th className="px-4 py-3 text-right">Vacaciones</th>
            <th className="px-4 py-3 text-right">Enfermedad</th>
            <th className="px-4 py-3">Estado</th>
            <th className="rounded-r-xl px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e, idx) => (
            <tr
              key={e.id}
              className={
                idx % 2 === 0 ? "bg-surface-raised" : "bg-surface-sunken/60"
              }
            >
              <td className="border-b border-border px-4 py-3 font-medium">
                {e.fullName}
              </td>
              <td className="border-b border-border px-4 py-3 text-ink-muted">
                {e.username}
              </td>
              <td className="border-b border-border px-4 py-3">
                {e.position === "SLOT_ATTENDANT" ? "Slot Attendant" : "Supervisor"}
              </td>
              <td className="border-b border-border px-4 py-3 text-right">
                {formatMoney(e.hourlyRate)}
              </td>
              <td className="border-b border-border px-4 py-3 text-right">
                {formatHours(e.vacationHours)}
              </td>
              <td className="border-b border-border px-4 py-3 text-right">
                {formatHours(e.sickHours)}
              </td>
              <td className="border-b border-border px-4 py-3">
                {e.active ? (
                  <Badge variant="success">Activo</Badge>
                ) : (
                  <Badge variant="muted">Inactivo</Badge>
                )}
              </td>
              <td className="border-b border-border px-4 py-3 text-right">
                <EditBalance employee={e} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditBalance({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [vacation, setVacation] = useState(employee.vacationHours.toString());
  const [sick, setSick] = useState(employee.sickHours.toString());
  const [rate, setRate] = useState(employee.hourlyRate.toString());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

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
      toast.success("Empleado actualizado ✓");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {employee.fullName}</DialogTitle>
          <DialogDescription>
            Ajusta el balance y el rate por hora. Los cambios quedan auditados.
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
      </DialogContent>
    </Dialog>
  );
}
