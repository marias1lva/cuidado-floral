import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import {
  Search,
  Filter,
  Eye,
  Send,
  CheckCircle,
  Clock,
  Heart,
  Phone,
  Mail,
  MapPin,
  Bell,
  User,
  LogOut,
  Calendar,
} from "lucide-react";
import { Button } from "./ui/button";
import { ChangePasswordButton } from "./change-password-button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  VolunteerAreaTabs,
  type VolunteerAreaTab,
} from "./volunteer-area-tabs";
import { VolunteerAgenda } from "./volunteer-hours/volunteer-agenda";
import { VolunteerHoursList } from "./volunteer-hours/volunteer-hours-list";
import { VolunteerHoursModal } from "./volunteer-hours/volunteer-hours-modal";
import {
  buildAppointmentId,
  buildNotificationId,
  loadAppointments,
  loadNotifications,
  saveAppointments,
  saveNotifications,
} from "./domain/patient-data";
import { loadPatients, savePatients } from "./domain/patients-data";
import { loadSectors } from "./domain/sectors-data";
import {
  claimVolunteerAgendaItem,
  loadVolunteerAgenda,
  loadVolunteerHours,
  saveVolunteerHours,
} from "./domain/volunteer-data";
import type {
  Appointment,
  AppNotification,
  Patient,
  PatientPriority,
  PatientWorkflowStatus,
  Sector,
} from "./domain/types";
import { PatientHistoryModal } from "./user-area/patient/patient-history-modal";
import {
  ForwardPatientModal,
  type ForwardPayload,
} from "./user-area/patient/forward-patient-modal";
import {
  formatDateBR,
  formatDateTimeBR,
  notificationTypeBadgeClass,
  notificationTypeLabel,
} from "./user-area/patient/patient-utils";
import type {
  VolunteerAgendaItem,
  VolunteerHourEntry,
} from "./volunteer-hours/types";
import { getLoggedUser } from "./domain/auth";

const statusConfig: Record<
  PatientWorkflowStatus,
  { className: string; icon: ElementType; label: string }
> = {
  pendente: {
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
    label: "pendente",
  },
  encaminhado: {
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Send,
    label: "encaminhado",
  },
  concluido: {
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
    label: "concluído",
  },
};

const priorityConfig: Record<
  PatientPriority,
  { className: string; label: string }
> = {
  alta: { className: "bg-red-100 text-red-700 border-red-200", label: "alta" },
  media: {
    className: "bg-orange-100 text-orange-700 border-orange-200",
    label: "média",
  },
  baixa: {
    className: "bg-gray-100 text-gray-700 border-gray-200",
    label: "baixa",
  },
};

function StatusBadge({ status }: { status: PatientWorkflowStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: PatientPriority }) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

interface VolunteerAreaProps {
  onLogout: () => void;
}

export function VolunteerArea({ onLogout }: VolunteerAreaProps) {
  const loggedUser = getLoggedUser();
  const volunteerId = loggedUser ? `vol-${loggedUser.sub}` : "";
  const volunteerName = loggedUser ? loggedUser.name : "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [activeTab, setActiveTab] = useState<VolunteerAreaTab>("patients");
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [historyPatientId, setHistoryPatientId] = useState<string | null>(null);
  const [forwardingPatientId, setForwardingPatientId] = useState<string | null>(
    null,
  );
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHourEntry[]>(
    [],
  );
  const [volunteerAgenda, setVolunteerAgenda] = useState<VolunteerAgendaItem[]>(
    [],
  );
  const [hasLoadedPatients, setHasLoadedPatients] = useState(false);
  const [hasLoadedAppointments, setHasLoadedAppointments] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  const [hasLoadedVolunteerHours, setHasLoadedVolunteerHours] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      loadPatients(),
      loadAppointments(),
      loadNotifications(),
      loadSectors(),
      loadVolunteerHours(),
      loadVolunteerAgenda(),
    ])
      .then(
        ([
          patients,
          loadedAppointments,
          loadedNotifications,
          loadedSectors,
          hours,
          agenda,
        ]) => {
          if (!isMounted) return;
          setPatientList(patients);
          setAppointments(loadedAppointments);
          setNotifications(loadedNotifications);
          setSectors(loadedSectors);
          setVolunteerHours(hours);
          setVolunteerAgenda(agenda);
          setHasLoadedPatients(true);
          setHasLoadedAppointments(true);
          setHasLoadedNotifications(true);
          setHasLoadedVolunteerHours(true);
        },
      )
      .catch((error) => {
        console.error("Falha ao carregar área da voluntária", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedPatients) return;
    void savePatients(patientList).catch((error) => {
      console.error("Falha ao salvar pacientes", error);
    });
  }, [patientList, hasLoadedPatients]);

  useEffect(() => {
    if (!hasLoadedAppointments) return;
    void saveAppointments(appointments).catch((error) => {
      console.error("Falha ao salvar atendimentos", error);
    });
  }, [appointments, hasLoadedAppointments]);

  useEffect(() => {
    if (!hasLoadedNotifications) return;
    void saveNotifications(notifications).catch((error) => {
      console.error("Falha ao salvar notificações", error);
    });
  }, [notifications, hasLoadedNotifications]);

  useEffect(() => {
    if (!hasLoadedVolunteerHours) return;
    void saveVolunteerHours(volunteerHours).catch((error) => {
      console.error("Falha ao salvar horas voluntárias", error);
    });
  }, [volunteerHours, hasLoadedVolunteerHours]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!notificationsRef.current) return;
      const target = event.target;
      if (
        target instanceof Node &&
        !notificationsRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationsOpen]);

  const pendingCount = patientList.filter(
    (p) => p.status === "pendente",
  ).length;
  const forwardedCount = patientList.filter(
    (p) => p.status === "encaminhado",
  ).length;
  const completedCount = patientList.filter(
    (p) => p.status === "concluido",
  ).length;
  const myHours = useMemo(
    () => volunteerHours.filter((entry) => entry.volunteerId === volunteerId),
    [volunteerHours, volunteerId],
  );
  const totalHours = myHours.reduce((sum, entry) => sum + entry.hours, 0);

  const [claimingId, setClaimingId] = useState<number | null>(null);
  const loggedUserId = loggedUser?.sub;

  // Mostra atividades abertas + as que já são minhas.
  const visibleAgenda = useMemo(
    () =>
      volunteerAgenda.filter(
        (item) =>
          item.status === "aberta" || item.volunteerId === loggedUserId,
      ),
    [volunteerAgenda, loggedUserId],
  );

  async function handleClaimActivity(item: VolunteerAgendaItem) {
    if (claimingId !== null) return;
    setClaimingId(item.id);
    try {
      const updated = await claimVolunteerAgendaItem(item.id);
      setVolunteerAgenda((current) =>
        current.map((a) => (a.id === updated.id ? updated : a)),
      );
    } catch (error) {
      console.error("Falha ao pegar atividade", error);
      // Recarrega pra ter a verdade do servidor (ex.: outra pegou antes).
      try {
        const fresh = await loadVolunteerAgenda();
        setVolunteerAgenda(fresh);
      } catch (e) {
        console.error("Falha ao recarregar agenda", e);
      }
    } finally {
      setClaimingId(null);
    }
  }

  const filtered = patientList.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const historyPatient = useMemo(
    () => patientList.find((p) => p.id === historyPatientId) ?? null,
    [patientList, historyPatientId],
  );
  const historyAppointments = useMemo(
    () =>
      historyPatientId
        ? appointments.filter((a) => a.patientId === historyPatientId)
        : [],
    [appointments, historyPatientId],
  );

  const appointmentsByPatient = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((a) => {
      map.set(a.patientId, (map.get(a.patientId) ?? 0) + 1);
    });
    return map;
  }, [appointments]);

  const volunteerNotifications = useMemo(
    () =>
      notifications
        .filter(
          (item) =>
            item.recipientRole === "voluntaria" &&
            (!item.recipientId || item.recipientId === volunteerId),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [notifications],
  );

  const unreadCount = useMemo(
    () => volunteerNotifications.filter((item) => !item.read).length,
    [volunteerNotifications],
  );

  function handleMarkNotificationAsRead(notificationId: string) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    );
  }

  function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    setNotifications((current) =>
      current.map((item) => {
        const isTarget =
          item.recipientRole === "voluntaria" &&
          (!item.recipientId || item.recipientId === volunteerId);
        return isTarget ? { ...item, read: true } : item;
      }),
    );
  }

  function handleStartForward(id: string) {
    setForwardingPatientId(id);
  }

  function handleConfirmForward({ sector, observations }: ForwardPayload) {
    const patient = patientList.find((p) => p.id === forwardingPatientId);
    if (!patient) {
      setForwardingPatientId(null);
      return;
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    const detalhe = observations
      ? `${sector.name} — ${observations}`
      : sector.name;

    const referralAppointment: Appointment = {
      id: buildAppointmentId(),
      patientId: patient.id,
      patientName: patient.name,
      date: today,
      volunteerName: volunteerName,
      status: "encaminhado",
      observacoes: `Encaminhamento para ${sector.name}.${
        observations ? ` ${observations}` : ""
      }`,
      encaminhamento: sector.slug,
      encaminhamentoDetalhe: detalhe,
      createdBy: "voluntaria",
      createdAt: now,
      updatedAt: now,
    };

    const notification: AppNotification = {
      id: buildNotificationId(),
      recipientRole: "paciente",
      recipientId: patient.id,
      type: "atendimento",
      title: "Encaminhamento realizado",
      message: `Você foi encaminhada para ${sector.name}.${
        observations ? ` ${observations}` : ""
      }`,
      date: now,
      read: false,
    };

    setPatientList((prev) =>
      prev.map((p) =>
        p.id === patient.id ? { ...p, status: "encaminhado" } : p,
      ),
    );
    setAppointments((current) => [referralAppointment, ...current]);
    setNotifications((current) => [notification, ...current]);
    setForwardingPatientId(null);
  }

  function handleComplete(id: string) {
    setPatientList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "concluido" } : p)),
    );
  }

  function handleSaveAppointment(appointment: Appointment) {
    setAppointments((current) => {
      const exists = current.some((a) => a.id === appointment.id);
      if (exists) {
        return current.map((a) => (a.id === appointment.id ? appointment : a));
      }
      return [appointment, ...current];
    });
  }

  function handleDeleteAppointment(id: string) {
    setAppointments((current) => current.filter((a) => a.id !== id));
  }

  function handleRegisterHours(entry: VolunteerHourEntry) {
    setVolunteerHours((current) =>
      [entry, ...current].sort((a, b) => b.date.localeCompare(a.date)),
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl w-11 h-11"
            style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}
          >
            <Heart className="text-white" size={20} fill="white" />
          </div>
          <div>
            <p className="font-semibold text-[var(--primary)] text-sm leading-tight">
              Cuidado Floral
            </p>
            <p className="text-xs text-[var(--muted-foreground)] leading-tight">
              Rede Feminina de Combate ao Câncer - Itapema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="relative cursor-pointer rounded-full p-1.5 transition-colors hover:bg-pink-50"
              aria-label="Abrir notificações"
              aria-haspopup="menu"
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={20} className="text-[var(--muted-foreground)]" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  <span className="absolute -right-2 -top-2 min-w-[1.1rem] rounded-full bg-pink-600 px-1 text-center text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </>
              )}
            </button>

            {isNotificationsOpen && (
              <div
                className="absolute right-0 z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-lg shadow-pink-100/40"
                role="menu"
              >
                <div className="flex items-center justify-between border-b border-pink-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">
                      Notificações
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {unreadCount > 0
                        ? `${unreadCount} não ${unreadCount === 1 ? "lida" : "lidas"}`
                        : "Sem pendências"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="rounded-full border border-pink-200 px-3 py-1 text-xs font-semibold text-pink-700 transition-colors hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Marcar tudo
                  </button>
                </div>

                {volunteerNotifications.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-[var(--muted-foreground)]">
                    Você ainda não tem notificações.
                  </div>
                ) : (
                  <ul className="pretty-scrollbar max-h-80 space-y-2 overflow-y-auto p-3">
                    {volunteerNotifications.map((item) => (
                      <li
                        key={item.id}
                        className={`rounded-xl border p-3 ${
                          item.read
                            ? "border-gray-100 bg-gray-50/80"
                            : "border-pink-200 bg-pink-50/70"
                        }`}
                      >
                        <div className="mb-1.5 flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {item.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={notificationTypeBadgeClass[item.type]}
                          >
                            {notificationTypeLabel[item.type]}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {item.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-[var(--muted-foreground)]">
                            {formatDateTimeBR(item.date)}
                          </span>
                          {!item.read && (
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkNotificationAsRead(item.id)
                              }
                              className="text-xs font-semibold text-pink-700 hover:text-pink-800"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
            <User size={17} />
            <span>{volunteerName}</span>
          </div>
          <ChangePasswordButton />
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-sm text-[var(--primary)] bg-transparent border-0 cursor-pointer hover:opacity-75 transition-opacity"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--primary)] mb-1">
              Área da Voluntária
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Gerencie pacientes, encaminhamentos e atividades de voluntariado
            </p>
          </div>
          {activeTab === "hours" && (
            <Button
              onClick={() => setIsHoursModalOpen(true)}
              className="flex items-center gap-2 rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white shadow-md shadow-pink-200 shrink-0"
            >
              <Calendar size={15} />
              Cadastrar horas de voluntariado
            </Button>
          )}
        </div>

        <VolunteerAreaTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "hours" ? (
          <div className="mb-8 rounded-3xl border border-pink-100 bg-white p-6 shadow-sm shadow-pink-100/40">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[var(--primary)]">
                  Registro de atividades de voluntariado
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Consulte a agenda e registre as horas realizadas pela
                  voluntária.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-pink-50 px-4 py-3 text-sm">
                <div>
                  <p className="text-[var(--muted-foreground)]">
                    Horas acumuladas
                  </p>
                  <p className="text-lg font-semibold text-[var(--primary)]">
                    {totalHours.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <VolunteerAgenda
                items={visibleAgenda}
                currentVolunteerId={loggedUserId}
                onClaim={handleClaimActivity}
                claimingId={claimingId}
                emptyMessage="Nenhuma atividade disponível no momento."
              />
              <VolunteerHoursList entries={myHours} />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-sm">Pendentes</span>
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Clock size={18} className="text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-yellow-600">
                  {pendingCount}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Aguardando análise
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-sm">Encaminhados</span>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Send size={18} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-blue-600">
                  {forwardedCount}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Em atendimento
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-sm">Concluídos</span>
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-green-600">
                  {completedCount}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Finalizados
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[var(--border)] p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-[var(--primary)]">
                  Lista de Pacientes
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Visualize e gerencie os cadastros das pacientes
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)] pointer-events-none"
                  />
                  <Input
                    placeholder="Buscar paciente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-full border-pink-200 focus-visible:border-[var(--primary)] bg-[var(--input-background)] text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44 rounded-full border-pink-200 bg-[var(--input-background)] text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="encaminhado">Encaminhado</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-pink-200 hover:bg-[var(--secondary)] shrink-0"
                  >
                    <Filter size={15} className="text-[var(--primary)]" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {filtered.length === 0 && (
                  <p className="text-center text-sm text-[var(--muted-foreground)] py-6">
                    Nenhuma paciente encontrada.
                  </p>
                )}
                {filtered.map((patient) => {
                  const appointmentCount =
                    appointmentsByPatient.get(patient.id) ?? 0;
                  return (
                    <div
                      key={patient.id}
                      className="p-5 rounded-xl border border-pink-100 bg-[var(--secondary)] hover:bg-pink-100/60 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1.5">
                            <span className="font-medium text-sm">
                              {patient.name}
                            </span>
                            <StatusBadge status={patient.status} />
                            <PriorityBadge priority={patient.priority} />
                            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-medium text-pink-700">
                              {appointmentCount}{" "}
                              {appointmentCount === 1
                                ? "atendimento"
                                : "atendimentos"}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)] mb-1">
                            {patient.symptoms}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Data de cadastro:{" "}
                            {formatDateBR(patient.registrationDate)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoryPatientId(patient.id)}
                            className="rounded-full border-pink-300 hover:bg-white text-xs"
                          >
                            <Eye size={13} />
                            Histórico
                          </Button>

                          {patient.status === "pendente" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartForward(patient.id)}
                              className="rounded-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white shadow-sm shadow-pink-200 text-xs"
                            >
                              <Send size={13} />
                              Encaminhar
                            </Button>
                          )}

                          {patient.status === "encaminhado" && (
                            <Button
                              size="sm"
                              onClick={() => handleComplete(patient.id)}
                              className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200 text-xs"
                            >
                              <CheckCircle size={13} />
                              Concluir
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-[var(--border)] pt-10 pb-4 bg-[var(--background)]">
        <div className="w-full max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            {/* Sobre Nós */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart size={16} className="text-[var(--primary)]" />
                <span className="font-semibold text-sm text-[var(--primary)]">
                  Sobre Nós
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                A Rede Feminina de Combate ao Câncer de Mama de Itapema trabalha
                para apoiar pacientes e promover a conscientização sobre o
                câncer de mama.
              </p>
            </div>

            {/* Contato */}
            <div>
              <p className="font-semibold text-sm mb-3">Contato</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Phone size={14} className="text-[var(--primary)]" />
                  (47) 3368-XXXX
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Mail size={14} className="text-[var(--primary)]" />
                  contato@cuidadofloral.org.br
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <MapPin size={14} className="text-[var(--primary)]" />
                  Itapema, SC
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 text-center text-xs text-[var(--muted-foreground)]">
            © 2025 Cuidado Floral - Rede Feminina de Combate ao Câncer de Mama.
            Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <VolunteerHoursModal
        open={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        onSubmit={handleRegisterHours}
        volunteerName={volunteerName}
        volunteerId={volunteerId}
      />

      {historyPatient && (
        <PatientHistoryModal
          patient={historyPatient}
          appointments={historyAppointments}
          volunteerName={volunteerName}
          onClose={() => setHistoryPatientId(null)}
          onSave={handleSaveAppointment}
          onDelete={handleDeleteAppointment}
        />
      )}

      <ForwardPatientModal
        open={forwardingPatientId !== null}
        patient={patientList.find((p) => p.id === forwardingPatientId) ?? null}
        sectors={sectors}
        onClose={() => setForwardingPatientId(null)}
        onConfirm={handleConfirmForward}
      />
    </div>
  );
}
