import { useEffect, useState } from "react";

import { Button } from "../../ui/button";
import { DatePicker, TimePicker } from "../../ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { Input } from "../../ui/input";
import type {
  Appointment,
  AppointmentReferral,
  AppointmentStatus,
} from "../../domain/types";
import {
  appointmentStatusLabel,
  referralLabel,
} from "./patient-utils";

const STATUS_OPTIONS: AppointmentStatus[] = [
  "agendado",
  "em_andamento",
  "concluido",
  "encaminhado",
  "cancelado",
];

const REFERRAL_OPTIONS: NonNullable<AppointmentReferral>[] = [
  "mastologista",
  "psicologia",
  "fisioterapia",
  "assistencia_social",
  "nutricao",
  "outro",
];

interface PatientHistoryFormProps {
  initialAppointment: Appointment | null;
  defaultPatientId: string;
  defaultPatientName: string;
  defaultVolunteerName: string;
  onSubmit: (appointment: Appointment) => void;
  onCancel: () => void;
  buildId: () => string;
}

interface FormState {
  date: string;
  time: string;
  volunteerName: string;
  status: AppointmentStatus;
  observacoes: string;
  encaminhamento: AppointmentReferral;
  encaminhamentoDetalhe: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildInitialState(
  appointment: Appointment | null,
  defaultVolunteerName: string,
): FormState {
  if (appointment) {
    return {
      date: appointment.date,
      time: appointment.time ?? "",
      volunteerName: appointment.volunteerName,
      status: appointment.status,
      observacoes: appointment.observacoes,
      encaminhamento: appointment.encaminhamento,
      encaminhamentoDetalhe: appointment.encaminhamentoDetalhe ?? "",
    };
  }
  return {
    date: todayISO(),
    time: "",
    volunteerName: defaultVolunteerName,
    status: "agendado",
    observacoes: "",
    encaminhamento: null,
    encaminhamentoDetalhe: "",
  };
}

export function PatientHistoryForm({
  initialAppointment,
  defaultPatientId,
  defaultPatientName,
  defaultVolunteerName,
  onSubmit,
  onCancel,
  buildId,
}: PatientHistoryFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(initialAppointment, defaultVolunteerName),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(buildInitialState(initialAppointment, defaultVolunteerName));
    setError(null);
  }, [initialAppointment, defaultVolunteerName]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.date) {
      setError("Informe a data do atendimento.");
      return;
    }
    if (!form.observacoes.trim()) {
      setError("Adicione observações sobre o atendimento.");
      return;
    }

    const now = new Date().toISOString();
    const appointment: Appointment = {
      id: initialAppointment?.id ?? buildId(),
      patientId: initialAppointment?.patientId ?? defaultPatientId,
      patientName: initialAppointment?.patientName ?? defaultPatientName,
      date: form.date,
      time: form.time || undefined,
      volunteerName: form.volunteerName.trim() || defaultVolunteerName,
      status: form.status,
      observacoes: form.observacoes.trim(),
      encaminhamento: form.encaminhamento,
      encaminhamentoDetalhe:
        form.encaminhamento && form.encaminhamentoDetalhe.trim()
          ? form.encaminhamentoDetalhe.trim()
          : undefined,
      createdAt: initialAppointment?.createdAt ?? now,
      updatedAt: now,
    };

    onSubmit(appointment);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data do atendimento *">
          <DatePicker
            value={form.date}
            onChange={(value) => update("date", value)}
            className="rounded-xl border-pink-200 bg-[var(--input-background)]"
            required
          />
        </Field>
        <Field label="Horário">
          <TimePicker
            value={form.time}
            onChange={(value) => update("time", value)}
            className="rounded-xl border-pink-200 bg-[var(--input-background)]"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Voluntária responsável">
          <Input
            value={form.volunteerName}
            onChange={(event) => update("volunteerName", event.target.value)}
            placeholder="Nome da voluntária"
            className="rounded-xl border-pink-200 bg-[var(--input-background)]"
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onValueChange={(value) => update("status", value as AppointmentStatus)}
          >
            <SelectTrigger className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {appointmentStatusLabel[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Observações *">
        <Textarea
          value={form.observacoes}
          onChange={(event) => update("observacoes", event.target.value)}
          placeholder="Descreva o atendimento, queixas, orientações..."
          rows={3}
          className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Encaminhamento">
          <Select
            value={form.encaminhamento ?? "none"}
            onValueChange={(value) =>
              update(
                "encaminhamento",
                value === "none" ? null : (value as NonNullable<AppointmentReferral>),
              )
            }
          >
            <SelectTrigger className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm">
              <SelectValue placeholder="Sem encaminhamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem encaminhamento</SelectItem>
              {REFERRAL_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {referralLabel[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Detalhe do encaminhamento">
          <Input
            value={form.encaminhamentoDetalhe}
            onChange={(event) => update("encaminhamentoDetalhe", event.target.value)}
            placeholder="Ex.: Encaminhada à fisioterapia oncológica"
            disabled={!form.encaminhamento}
            className="rounded-xl border-pink-200 bg-[var(--input-background)] disabled:opacity-50"
          />
        </Field>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-full border-pink-200 text-pink-700 hover:bg-pink-50"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
        >
          {initialAppointment ? "Salvar alterações" : "Adicionar atendimento"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[var(--foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}
