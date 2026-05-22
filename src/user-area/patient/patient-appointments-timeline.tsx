import { CalendarDays, Clock, User2, ArrowRight, Stethoscope } from "lucide-react";

import { Badge } from "../../ui/badge";
import type { Appointment } from "../../domain/types";
import {
  appointmentStatusBadgeClass,
  appointmentStatusLabel,
  formatDateBR,
  referralLabel,
} from "./patient-utils";
import { AppointmentAttachments } from "./appointment-attachments";

interface PatientAppointmentsTimelineProps {
  appointments: Appointment[];
}

export function PatientAppointmentsTimeline({
  appointments,
}: PatientAppointmentsTimelineProps) {
  const sorted = [...appointments].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm shadow-pink-100/40">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
          <CalendarDays className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            Histórico de atendimentos
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Acompanhe suas consultas, observações e encaminhamentos.
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
          Nenhum atendimento registrado até o momento.
        </p>
      ) : (
        <ol className="relative ml-3 border-l-2 border-pink-100">
          {sorted.map((appointment) => (
            <li key={appointment.id} className="relative pl-6 pb-6 last:pb-0">
              <span className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-pink-200 bg-white">
                <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
              </span>
              <article className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4">
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
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <User2 size={12} />
                    {appointment.volunteerName}
                  </span>
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
              </article>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
