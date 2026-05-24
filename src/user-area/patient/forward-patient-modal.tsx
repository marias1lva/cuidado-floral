import { useState } from "react";
import { Send } from "lucide-react";

import { Button } from "../../ui/button";
import { Dialog } from "../../ui/dialog";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { Patient, Sector } from "../../domain/types";

export interface ForwardPayload {
  sector: Sector;
  observations: string;
}

interface ForwardPatientModalProps {
  open: boolean;
  patient: Patient | null;
  sectors: Sector[];
  onClose: () => void;
  onConfirm: (payload: ForwardPayload) => void;
}

export function ForwardPatientModal({
  open,
  patient,
  sectors,
  onClose,
  onConfirm,
}: ForwardPatientModalProps) {
  const [sectorId, setSectorId] = useState("");
  const [observations, setObservations] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSectorId("");
    setObservations("");
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sector = sectors.find((s) => s.id === sectorId);
    if (!sector) {
      setError("Selecione um setor cadastrado para encaminhar a paciente.");
      return;
    }
    onConfirm({ sector, observations: observations.trim() });
    reset();
  }

  if (!open || !patient) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Encaminhar paciente"
      description={`Selecione o setor para encaminhar ${patient.name}.`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Setor cadastrado *
          </label>
          <Select
            value={sectorId}
            onValueChange={(value) => {
              setSectorId(value);
              setError(null);
            }}
          >
            <SelectTrigger className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm">
              <SelectValue placeholder="Selecione um setor..." />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sectorId &&
            sectors.find((s) => s.id === sectorId)?.description && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                {sectors.find((s) => s.id === sectorId)?.description}
              </p>
            )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Observações para a paciente
          </label>
          <Textarea
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
            placeholder="Ex.: Orientações sobre próximos passos, documentos necessários..."
            rows={3}
            className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Será enviada como notificação à paciente e registrada no histórico.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="h-11 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            <Send className="mr-2 h-4 w-4" />
            Encaminhar paciente
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
