import { useMemo, useState } from "react";

import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { activityCategoryOptions } from "./constants";
import type { VolunteerActivityCategory, VolunteerHourEntry } from "./types";

interface VolunteerHoursModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: VolunteerHourEntry) => void;
}

interface FormState {
  activityName: string;
  category: VolunteerActivityCategory;
  date: string;
  hours: string;
  location: string;
  notes: string;
}

const initialFormState: FormState = {
  activityName: "",
  category: "acolhimento",
  date: "",
  hours: "",
  location: "",
  notes: "",
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function VolunteerHoursModal({
  open,
  onClose,
  onSubmit,
}: VolunteerHoursModalProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );

  const maxDate = useMemo(() => getTodayDate(), []);

  function resetForm() {
    setForm(initialFormState);
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const parsedHours = Number(form.hours.replace(",", "."));

    if (!form.activityName.trim()) {
      nextErrors.activityName = "Informe a atividade realizada.";
    }

    if (!form.date) {
      nextErrors.date = "Selecione a data da atividade.";
    }

    if (!form.hours.trim()) {
      nextErrors.hours = "Informe a quantidade de horas.";
    } else if (Number.isNaN(parsedHours) || parsedHours <= 0) {
      nextErrors.hours = "As horas devem ser maiores que zero.";
    } else if (parsedHours > 24) {
      nextErrors.hours = "Use um valor coerente de até 24 horas.";
    }

    if (!form.location.trim()) {
      nextErrors.location = "Informe o local da atividade.";
    }

    setErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      parsedHours,
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { isValid, parsedHours } = validateForm();
    if (!isValid) {
      return;
    }

    onSubmit({
      id: Date.now(),
      activityName: form.activityName.trim(),
      category: form.category,
      date: form.date,
      hours: parsedHours,
      location: form.location.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    });

    handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Cadastrar horas de voluntariado"
      description="Registre uma nova atividade realizada pela voluntária."
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Atividade"
            error={errors.activityName}
            className="sm:col-span-2"
          >
            <Input
              value={form.activityName}
              onChange={(event) => setField("activityName", event.target.value)}
              placeholder="Ex.: Atendimento no balcão"
              aria-invalid={Boolean(errors.activityName)}
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
            />
          </FormField>

          <FormField label="Categoria">
            <Select
              value={form.category}
              onValueChange={(value) =>
                setField("category", value as VolunteerActivityCategory)
              }
            >
              <SelectTrigger className="w-full rounded-2xl border-pink-200 bg-[var(--input-background)]">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {activityCategoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Data" error={errors.date}>
            <Input
              type="date"
              value={form.date}
              max={maxDate}
              onChange={(event) => setField("date", event.target.value)}
              aria-invalid={Boolean(errors.date)}
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
            />
          </FormField>

          <FormField label="Horas" error={errors.hours}>
            <Input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              inputMode="decimal"
              value={form.hours}
              onChange={(event) => setField("hours", event.target.value)}
              placeholder="Ex.: 3.5"
              aria-invalid={Boolean(errors.hours)}
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
            />
          </FormField>

          <FormField label="Local" error={errors.location}>
            <Input
              value={form.location}
              onChange={(event) => setField("location", event.target.value)}
              placeholder="Ex.: Sede Itapema"
              aria-invalid={Boolean(errors.location)}
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
            />
          </FormField>

          <FormField
            label="Observações"
            className="sm:col-span-2"
          >
            <Textarea
              value={form.notes}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="Detalhes opcionais sobre a atividade."
              className="min-h-28 border-pink-200 bg-[var(--input-background)]"
            />
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-pink-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="rounded-full border-pink-200"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            Salvar registro
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}

function FormField({ label, children, error, className }: FormFieldProps) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
