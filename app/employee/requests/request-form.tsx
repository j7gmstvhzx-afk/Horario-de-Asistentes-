"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RequestForm({
  vacationHours,
  sickHours,
}: {
  vacationHours: number;
  sickHours: number;
}) {
  const router = useRouter();
  const [type, setType] = useState<"VACATION" | "SICK">("VACATION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState("8");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/pto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          startDate,
          endDate,
          hours: Number(hours),
          reason: reason || undefined,
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        toast.error(body.error ?? "No se pudo crear la solicitud.");
        return;
      }
      toast.success("Solicitud enviada ✓");
      setStartDate("");
      setEndDate("");
      setHours("8");
      setReason("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const available = type === "VACATION" ? vacationHours : sickHours;

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as "VACATION" | "SICK")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VACATION">Vacaciones</SelectItem>
            <SelectItem value="SICK">Enfermedad</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-ink-muted">
          Disponibles: {available}h
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hours">Horas</Label>
        <Input
          id="hours"
          type="number"
          min="0.5"
          step="0.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="start">Desde</Label>
        <Input
          id="start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="end">Hasta</Label>
        <Input
          id="end"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="reason">Motivo (opcional)</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: cita médica, viaje familiar"
          maxLength={200}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enviando…" : "Enviar solicitud"}
        </Button>
      </div>
    </form>
  );
}
