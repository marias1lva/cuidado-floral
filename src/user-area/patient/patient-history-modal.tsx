import { useMemo, useState } from "react";
import { X, Pencil, Trash2, Plus, ArrowRight, Clock, User2, Stethoscope } from "lucide-react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import type { Appointment, Patient } from "../../domain/types";
import { buildAppointmentId } from "../../domain/patient-data";
import { DEMO_VOLUNTEER_NAME } from "../../domain/storage";
import {
  appointmentStatusBadgeClass,
  appointmentStatusLabel,
  formatDateBR,
  referralLabel,
} from "./patient-utils";
import { PatientHistoryForm } from "./patient-history-form";
import { AppointmentAttachments } from "./appointment-attachments";

interface PatientHistoryModalProps {
  patient: Patient;
  appointments: Appointment[];
  volunteerName?: string;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  onDelete: (appointmentId: string) => void;
}

export function PatientHistoryModal({
  patient,
  appointments,
  volunteerName,
  onClose,
  onSave,
  onDelete,
}: PatientHistoryModalProps) {
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...appointments].sort((a, b) => b.date.localeCompare(a.date)),
    [appointments],
  );

  const isFormOpen = isCreating || editingAppointment !== null;
  const defaultVolunteerName = volunteerName ?? DEMO_VOLUNTEER_NAME;

  function handleStartCreate() {
    setEditingAppointment(null);
    setIsCreating(true);
  }

  function handleStartEdit(appointment: Appointment) {
    setIsCreating(false);
    setEditingAppointment(appointment);
  }

  function handleCloseForm() {
    setIsCreating(false);
    setEditingAppointment(null);
  }

  function handleSubmit(appointment: Appointment) {
    onSave(appointment);
    handleCloseForm();
  }

  function handleConfirmDelete(id: string) {
    onDelete(id);
    setConfirmDeleteId(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-3xl border border-pink-100 bg-white shadow-xl shadow-pink-100/40 max-h-[90vh] overflow-hidden flex flex-col">
        <header className="flex items-start justify-between border-b border-pink-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-pink-600">
              Histórico de atendimento
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--primary)]">
              {patient.name}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
              {appointments.length}{" "}
              {appointments.length === 1 ? "atendimento registrado" : "atendimentos registrados"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {!isFormOpen && (
            <div className="flex justify-end">
              <Button
                onClick={handleStartCreate}
                className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
              >
                <Plus size={14} />
                Novo atendimento
              </Button>
            </div>
          )}

          {isFormOpen && (
            <section className="rounded-2xl border border-pink-200 bg-pink-50/40 p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--primary)]">
                {editingAppointment ? "Editar atendimento" : "Registrar novo atendimento"}
              </h3>
              <PatientHistoryForm
                initialAppointment={editingAppointment}
                defaultPatientId={patient.id}
                defaultPatientName={patient.name}
                defaultVolunteerName={defaultVolunteerName}
                onSubmit={handleSubmit}
                onCancel={handleCloseForm}
                buildId={buildAppointmentId}
              />
            </section>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Atendimentos anteriores
            </h3>
            {sorted.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
                Nenhum atendimento registrado para esta paciente.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sorted.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="rounded-2xl border border-pink-100 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--foreground)]">
                          {formatDateBR(appointment.date)}
                        </span>
                        {appointment.time && (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                            <Clock size={12} />
                            {appointment.time}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={appointmentStatusBadgeClass[appointment.status]}
                        >
                          {appointmentStatusLabel[appointment.status]}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <User2 size={12} />
                          {appointment.volunteerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(appointment)}
                          className="rounded-full text-pink-700 hover:bg-pink-50"
                          aria-label="Editar atendimento"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(appointment.id)}
                          className="rounded-full text-red-600 hover:bg-red-50"
                          aria-label="Excluir atendimento"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {appointment.professionalName && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <Stethoscope size={12} />
                        {appointment.professionalName}
                      </p>
                    )}

                    {appointment.observacoes && (
                      <p className="mt-3 text-sm text-[var(--foreground)]">
                        {appointment.observacoes}
                      </p>
                    )}

                    {appointment.attachments && appointment.attachments.length > 0 && (
                      <div className="mt-3">
                        <AppointmentAttachments attachments={appointment.attachments} />
                      </div>
                    )}

                    {appointment.encaminhamento && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-purple-100 bg-purple-50/60 px-3 py-2 text-xs text-purple-800">
                        <ArrowRight size={12} />
                        <span className="font-semibold">
                          Encaminhamento: {referralLabel[appointment.encaminhamento]}
                        </span>
                        {appointment.encaminhamentoDetalhe && (
                          <span className="text-purple-700">
                            — {appointment.encaminhamentoDetalhe}
                          </span>
                        )}
                      </div>
                    )}

                    {confirmDeleteId === appointment.id && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span>Tem certeza que deseja excluir este atendimento?</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-full text-red-700 hover:bg-red-100"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmDelete(appointment.id)}
                            className="rounded-full bg-red-600 text-white hover:bg-red-700"
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
