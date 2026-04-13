import { useEffect, useState, type ElementType } from "react";
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
  initialVolunteerHours,
  volunteerAgenda,
} from "./volunteer-hours/constants";
import {
  VolunteerAreaTabs,
  type VolunteerAreaTab,
} from "./volunteer-area-tabs";
import { VolunteerAgenda } from "./volunteer-hours/volunteer-agenda";
import { VolunteerHoursList } from "./volunteer-hours/volunteer-hours-list";
import { VolunteerHoursModal } from "./volunteer-hours/volunteer-hours-modal";
import type { VolunteerHourEntry } from "./volunteer-hours/types";

type Status = "pendente" | "encaminhado" | "concluído";
type Priority = "alta" | "média" | "baixa";

interface Patient {
  id: number;
  name: string;
  date: string;
  status: Status;
  priority: Priority;
  symptoms: string;
}

const initialPatients: Patient[] = [
  {
    id: 1,
    name: "Maria Silva",
    date: "10/10/2025",
    status: "pendente",
    priority: "alta",
    symptoms: "Nódulo detectado, necessita avaliação urgente",
  },
  {
    id: 2,
    name: "Ana Souza",
    date: "08/10/2025",
    status: "encaminhado",
    priority: "média",
    symptoms: "Consulta de acompanhamento pós-cirurgia",
  },
  {
    id: 3,
    name: "Carla Santos",
    date: "05/10/2025",
    status: "concluído",
    priority: "baixa",
    symptoms: "Exames de rotina - Resultados normais",
  },
  {
    id: 4,
    name: "Beatriz Lima",
    date: "12/10/2025",
    status: "pendente",
    priority: "média",
    symptoms: "Primeira consulta - histórico familiar",
  },
];

const statusConfig: Record<
  Status,
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
  concluído: {
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
    label: "concluído",
  },
};

const priorityConfig: Record<Priority, string> = {
  alta: "bg-red-100 text-red-700 border-red-200",
  média: "bg-orange-100 text-orange-700 border-orange-200",
  baixa: "bg-gray-100 text-gray-700 border-gray-200",
};

function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={priorityConfig[priority]}>
      {priority}
    </Badge>
  );
}

interface VolunteerAreaProps {
  onLogout: () => void;
}

export function VolunteerArea({ onLogout }: VolunteerAreaProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [patientList, setPatientList] = useState<Patient[]>(initialPatients);
  const [activeTab, setActiveTab] = useState<VolunteerAreaTab>("patients");
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [volunteerHours, setVolunteerHours] = useState<VolunteerHourEntry[]>(() => {
    if (typeof window === "undefined") {
      return initialVolunteerHours;
    }

    const savedEntries = window.localStorage.getItem("volunteer-hours");
    if (!savedEntries) {
      return initialVolunteerHours;
    }

    try {
      return JSON.parse(savedEntries) as VolunteerHourEntry[];
    } catch {
      return initialVolunteerHours;
    }
  });

  const pendingCount   = patientList.filter((p) => p.status === "pendente").length;
  const forwardedCount = patientList.filter((p) => p.status === "encaminhado").length;
  const completedCount = patientList.filter((p) => p.status === "concluído").length;
  const totalHours = volunteerHours.reduce((sum, entry) => sum + entry.hours, 0);

  const filtered = patientList.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleForward(id: number) {
    setPatientList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "encaminhado" as Status } : p))
    );
  }

  function handleComplete(id: number) {
    setPatientList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "concluído" as Status } : p))
    );
  }

  useEffect(() => {
    window.localStorage.setItem("volunteer-hours", JSON.stringify(volunteerHours));
  }, [volunteerHours]);

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
            <span>Voluntária Maria</span>
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
                      <SelectItem value="concluído">Concluído</SelectItem>
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
                {filtered.map((patient) => (
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
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] mb-1">
                          {patient.symptoms}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Data de cadastro: {patient.date}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-pink-300 hover:bg-white text-xs"
                        >
                          <Eye size={13} />
                          Visualizar
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
                ))}
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
    </div>
  );
}
