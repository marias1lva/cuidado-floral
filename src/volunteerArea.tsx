import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  Search, Filter, Eye, Send, CheckCircle,
  Clock, Heart, Phone, Mail, MapPin,
  Bell, User, LogOut, Calendar,
} from "lucide-react";
import { Button } from "./ui/button";
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
  loadAppointments,
  saveAppointments,
} from "./domain/patient-data";
import { loadPatients, savePatients } from "./domain/patients-data";
import { DEMO_VOLUNTEER_NAME } from "./domain/storage";
import {
  loadVolunteerAgenda,
  loadVolunteerHours,
  saveVolunteerHours,
} from "./domain/volunteer-data";
import type {
  Appointment,
  Patient,
  PatientPriority,
  PatientWorkflowStatus,
} from "./domain/types";
import { PatientHistoryModal } from "./user-area/patient/patient-history-modal";
import { formatDateBR } from "./user-area/patient/patient-utils";
import type {
  VolunteerAgendaItem,
  VolunteerHourEntry,
} from "./volunteer-hours/types";

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

const priorityConfig: Record<PatientPriority, { className: string; label: string }> = {
  alta: { className: "bg-red-100 text-red-700 border-red-200", label: "alta" },
  media: {
    className: "bg-orange-100 text-orange-700 border-orange-200",
    label: "média",
  },
  baixa: { className: "bg-gray-100 text-gray-700 border-gray-200", label: "baixa" },
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<VolunteerAreaTab>("patients");
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [historyPatientId, setHistoryPatientId] = useState<string | null>(null);
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHourEntry[]>([]);
  const [volunteerAgenda, setVolunteerAgenda] = useState<VolunteerAgendaItem[]>([]);
  const [hasLoadedPatients, setHasLoadedPatients] = useState(false);
  const [hasLoadedAppointments, setHasLoadedAppointments] = useState(false);
  const [hasLoadedVolunteerHours, setHasLoadedVolunteerHours] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      loadPatients(),
      loadAppointments(),
      loadVolunteerHours(),
      loadVolunteerAgenda(),
    ])
      .then(([patients, loadedAppointments, hours, agenda]) => {
        if (!isMounted) return;
        setPatientList(patients);
        setAppointments(loadedAppointments);
        setVolunteerHours(hours);
        setVolunteerAgenda(agenda);
        setHasLoadedPatients(true);
        setHasLoadedAppointments(true);
        setHasLoadedVolunteerHours(true);
      })
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
    if (!hasLoadedVolunteerHours) return;
    void saveVolunteerHours(volunteerHours).catch((error) => {
      console.error("Falha ao salvar horas voluntárias", error);
    });
  }, [volunteerHours, hasLoadedVolunteerHours]);

  const pendingCount = patientList.filter((p) => p.status === "pendente").length;
  const forwardedCount = patientList.filter((p) => p.status === "encaminhado").length;
  const completedCount = patientList.filter((p) => p.status === "concluido").length;
  const totalHours = volunteerHours.reduce((sum, entry) => sum + entry.hours, 0);

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

  function handleForward(id: string) {
    setPatientList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "encaminhado" } : p)),
    );
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
          <div className="relative cursor-pointer">
            <Bell size={20} className="text-[var(--muted-foreground)]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--primary)]" />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
            <User size={17} />
            <span>{DEMO_VOLUNTEER_NAME}</span>
          </div>
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
                  Consulte a agenda e registre as horas realizadas pela voluntária.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-pink-50 px-4 py-3 text-sm">
                <div>
                  <p className="text-[var(--muted-foreground)]">Horas acumuladas</p>
                  <p className="text-lg font-semibold text-[var(--primary)]">
                    {totalHours.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <VolunteerAgenda items={volunteerAgenda} />
              <VolunteerHoursList entries={volunteerHours} />
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
                <p className="text-2xl font-semibold text-yellow-600">{pendingCount}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Aguardando análise</p>
              </div>

              <div className="bg-white rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-sm">Encaminhados</span>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Send size={18} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-blue-600">{forwardedCount}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Em atendimento</p>
              </div>

              <div className="bg-white rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-sm">Concluídos</span>
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle size={18} className="text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-green-600">{completedCount}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Finalizados</p>
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
                  const appointmentCount = appointmentsByPatient.get(patient.id) ?? 0;
                  return (
                    <div
                      key={patient.id}
                      className="p-5 rounded-xl border border-pink-100 bg-[var(--secondary)] hover:bg-pink-100/60 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1.5">
                            <span className="font-medium text-sm">{patient.name}</span>
                            <StatusBadge status={patient.status} />
                            <PriorityBadge priority={patient.priority} />
                            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] font-medium text-pink-700">
                              {appointmentCount}{" "}
                              {appointmentCount === 1 ? "atendimento" : "atendimentos"}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)] mb-1">
                            {patient.symptoms}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            Data de cadastro: {formatDateBR(patient.registrationDate)}
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
                              onClick={() => handleForward(patient.id)}
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
                <span className="font-semibold text-sm text-[var(--primary)]">Sobre Nós</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                A Rede Feminina de Combate ao Câncer de Mama de Itapema trabalha para apoiar
                pacientes e promover a conscientização sobre o câncer de mama.
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

            {/* Links Úteis */}
            <div>
              <p className="font-semibold text-sm mb-3">Links Úteis</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Sobre o Câncer de Mama", highlight: false },
                  { label: "Como Ajudar", highlight: true },
                  { label: "Política de Privacidade", highlight: false },
                  { label: "Termos de Uso", highlight: false },
                ].map(({ label, highlight }) => (
                  <a
                    key={label}
                    href="#"
                    className={`text-sm no-underline hover:text-[var(--primary)] transition-colors ${
                      highlight ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 text-center text-xs text-[var(--muted-foreground)]">
            © 2025 Cuidado Floral - Rede Feminina de Combate ao Câncer de Mama. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <VolunteerHoursModal
        open={isHoursModalOpen}
        onClose={() => setIsHoursModalOpen(false)}
        onSubmit={handleRegisterHours}
      />

      {historyPatient && (
        <PatientHistoryModal
          patient={historyPatient}
          appointments={historyAppointments}
          volunteerName={DEMO_VOLUNTEER_NAME}
          onClose={() => setHistoryPatientId(null)}
          onSave={handleSaveAppointment}
          onDelete={handleDeleteAppointment}
        />
      )}
    </div>
  );
}
