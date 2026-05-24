import { useEffect, useMemo, useState } from "react";
import { Bell, Calendar, FileText, Plus } from "lucide-react";

import {
  buildAppointmentId,
  loadAppointments,
  loadNotifications,
  saveAppointments,
  saveNotifications,
} from "../../domain/patient-data";
import { loadUser, saveUser } from "../../domain/admin-data";
import {
  DEMO_PATIENT_ID,
  DEMO_PATIENT_NAME,
  DEMO_PATIENT_USER_ID,
} from "../../domain/storage";
import type { Appointment, AppNotification } from "../../domain/types";
import type { ManagedUser } from "../../admin/types";
import { PatientNotifications } from "./patient-notifications";
import { PatientAppointmentsTimeline } from "./patient-appointments-timeline";
import { formatDateBR } from "./patient-utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Dialog } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";

function normalizeProfileDate(value: string) {
  if (!value) {
    return "";
  }

  if (value.includes("/")) {
    const [day, month, year] = value.split("/");
    if (day && month && year) {
      return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return value;
}

interface PatientDashboardProps {
  onPatientNameChange?: (name: string) => void;
}

export function PatientDashboard({
  onPatientNameChange,
}: PatientDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [patientUser, setPatientUser] = useState<ManagedUser | null>(null);
  const [patientName, setPatientName] = useState(DEMO_PATIENT_NAME);
  const [patientBirthDate, setPatientBirthDate] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [hasLoadedAppointments, setHasLoadedAppointments] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([loadAppointments(), loadNotifications()])
      .then(([loadedAppointments, loadedNotifications]) => {
        if (!isMounted) return;
        setAppointments(loadedAppointments);
        setNotifications(loadedNotifications);
        setHasLoadedAppointments(true);
        setHasLoadedNotifications(true);
      })
      .catch((error) => {
        console.error("Falha ao carregar dados da paciente", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadUser(DEMO_PATIENT_USER_ID)
      .then((loadedUser) => {
        if (!isMounted) return;
        setPatientUser(loadedUser);
        setPatientName(loadedUser.name);
        setPatientBirthDate(normalizeProfileDate(loadedUser.date));
      })
      .catch((error) => {
        console.error("Falha ao carregar perfil da paciente", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const patientAppointments = useMemo(
    () => appointments.filter((apt) => apt.patientId === DEMO_PATIENT_ID),
    [appointments],
  );
  const patientNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.recipientRole === "paciente" &&
          (!notification.recipientId ||
            notification.recipientId === DEMO_PATIENT_ID),
      ),
    [notifications],
  );

  useEffect(() => {
    if (!hasLoadedNotifications) return;
    void saveNotifications(notifications).catch((error) => {
      console.error("Falha ao salvar notificações", error);
    });
  }, [notifications, hasLoadedNotifications]);

  useEffect(() => {
    if (!hasLoadedAppointments) return;
    void saveAppointments(appointments).catch((error) => {
      console.error("Falha ao salvar atendimentos", error);
    });
  }, [appointments, hasLoadedAppointments]);

  async function handleSaveAppointment(appointment: Appointment) {
    const nextAppointments = [appointment, ...appointments];
    setAppointments(nextAppointments);

    try {
      await saveAppointments(nextAppointments);
    } catch (error) {
      console.error("Falha ao salvar atendimento", error);
    }
  }

  async function handleSaveProfile(updatedUser: ManagedUser) {
    setPatientUser(updatedUser);
    setPatientName(updatedUser.name);
    setPatientBirthDate(normalizeProfileDate(updatedUser.date));

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.patientId === DEMO_PATIENT_ID
          ? { ...appointment, patientName: updatedUser.name }
          : appointment,
      ),
    );

    try {
      await saveUser(updatedUser);
      if (onPatientNameChange) {
        onPatientNameChange(updatedUser.name);
      }
    } catch (error) {
      console.error("Falha ao salvar cadastro da paciente", error);
    }
  }

  const completedCount = useMemo(
    () => patientAppointments.filter((a) => a.status === "concluido").length,
    [patientAppointments],
  );
  const scheduledCount = useMemo(
    () =>
      patientAppointments.filter(
        (a) => a.status === "agendado" || a.status === "em_andamento",
      ).length,
    [patientAppointments],
  );
  const nextAppointment = useMemo(() => {
    const upcoming = patientAppointments
      .filter((a) => a.status === "agendado" || a.status === "em_andamento")
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0];
  }, [patientAppointments]);

  const unreadCount = patientNotifications.filter((n) => !n.read).length;

  function handleMarkAsRead(id: string) {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function handleMarkAllAsRead() {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <DashboardCard
          icon={<FileText className="h-5 w-5 text-pink-600" />}
          title="Cadastro"
        >
          <div className="flex h-full flex-col justify-end">
            <p className="mb-5 max-w-[260px] text-sm leading-relaxed text-[var(--muted-foreground)]">
              Atualize suas informações pessoais e histórico médico
            </p>
            <Button
              className="h-11 w-full rounded-full bg-[var(--primary)] font-semibold text-white hover:bg-[var(--primary)]/90"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Atualizar Dados
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard
          icon={<Calendar className="h-5 w-5 text-pink-600" />}
          title="Atendimentos"
        >
          <div className="flex h-full flex-col justify-end gap-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Próximo:</span>
              {nextAppointment ? (
                <Badge
                  variant="outline"
                  className="border-pink-200 bg-pink-50 text-pink-700"
                >
                  {formatDateBR(nextAppointment.date)}
                  {nextAppointment.time ? `, ${nextAppointment.time}` : ""}
                </Badge>
              ) : (
                <span className="text-[var(--muted-foreground)]">Sem data</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Total:</span>
              <span>{scheduledCount} agendados</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
              <span>Concluídos:</span>
              <span>{completedCount}</span>
            </div>
            <Button
              className="mt-3 h-11 rounded-full bg-[var(--primary)] font-semibold text-white hover:bg-[var(--primary)]/90"
              onClick={() => setIsRequestModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Solicitar Atendimento
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard
          icon={
            <div className="relative">
              <Bell className="h-5 w-5 text-pink-600" />
              {unreadCount > 0 && (
                <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[11px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          }
          title="Notificações"
        >
          <div className="flex h-full flex-col justify-end">
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              Você tem {unreadCount}{" "}
              {unreadCount === 1
                ? "notificação não lida"
                : "notificações não lidas"}
            </p>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <PatientAppointmentsTimeline appointments={patientAppointments} />
        <PatientNotifications
          notifications={patientNotifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </div>
      <PatientProfileModal
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        patientUser={patientUser}
        onSave={handleSaveProfile}
      />
      <PatientRequestAppointmentModal
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSave={handleSaveAppointment}
        patientName={patientName}
      />
    </div>
  );
}

interface PatientRequestAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  patientName: string;
}

function PatientRequestAppointmentModal({
  open,
  onClose,
  onSave,
  patientName,
}: PatientRequestAppointmentModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [consultationType, setConsultationType] = useState(
    "Acolhimento inicial",
  );
  const [notes, setNotes] = useState("");

  function handleClose() {
    setDate("");
    setTime("");
    setConsultationType("Acolhimento inicial");
    setNotes("");
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || !time) {
      return;
    }

    onSave({
      id: buildAppointmentId(),
      patientId: DEMO_PATIENT_ID,
      patientName,
      date,
      time,
      volunteerName: "Atendimento Solicitado",
      status: "agendado",
      observacoes: `Solicitação de atendimento: ${consultationType}${
        notes ? ` — ${notes}` : ""
      }`,
      encaminhamento: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    handleClose();
  }

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Solicitar atendimento"
      description="Insira os dados para solicitar um novo atendimento."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Nome do paciente
          </label>
          <Input
            type="text"
            value={patientName}
            disabled
            className="bg-[#F8F1F5] text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Data
            </label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Horário
            </label>
            <Input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Tipo de consulta
          </label>
          <select
            value={consultationType}
            onChange={(event) => setConsultationType(event.target.value)}
            className="w-full rounded-2xl border border-input bg-input-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50"
          >
            <option>Acolhimento inicial</option>
            <option>Consulta de acompanhamento</option>
            <option>Sessão de fisioterapia</option>
            <option>Sessão de psicologia</option>
            <option>Consulta de retorno</option>
            <option>Outra</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Observações
          </label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Descreva alguma informação adicional..."
            className="text-sm"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" className="h-11 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
            Solicitar atendimento
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

interface PatientProfileModalProps {
  open: boolean;
  onClose: () => void;
  patientUser: ManagedUser | null;
  onSave: (user: ManagedUser) => void;
}

function PatientProfileModal({
  open,
  onClose,
  patientUser,
  onSave,
}: PatientProfileModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (patientUser) {
      setName(patientUser.name);
      setBirthDate(normalizeProfileDate(patientUser.date));
    } else {
      setName("");
      setBirthDate("");
    }
  }, [open, patientUser]);

  function handleClose() {
    onClose();
    setName(patientUser?.name ?? "");
    setBirthDate(normalizeProfileDate(patientUser?.date ?? ""));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientUser) {
      return;
    }

    onSave({
      ...patientUser,
      name: name.trim(),
      date: birthDate,
    });
    handleClose();
  }

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Atualizar cadastro"
      description="Altere seu nome e data de nascimento."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Nome completo
          </label>
          <Input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="text-sm"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Data de nascimento
          </label>
          <Input
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            required
            className="text-sm"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" className="h-11 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90">
            Salvar alterações
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DashboardCard({
  icon,
  title,
  children,
}: DashboardCardProps) {
  return (
    <section className="flex min-h-[274px] flex-col rounded-2xl border border-pink-100 bg-white p-7 shadow-sm shadow-pink-100/50">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="text-xl font-medium text-[var(--foreground)]">
          {title}
        </h2>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-100">
          {icon}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}
