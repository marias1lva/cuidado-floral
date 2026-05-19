import type { ManagedUser } from "../src/admin/types";
import {
  DEMO_DONOR_ID,
  DEMO_DONOR_NAME,
  DEMO_PATIENT_ID,
  DEMO_PATIENT_NAME,
  DEMO_VOLUNTEER_NAME,
} from "../src/domain/demo";
import type {
  AppNotification,
  Appointment,
  Donation,
  Patient,
} from "../src/domain/types";
import type {
  VolunteerAgendaItem,
  VolunteerHourEntry,
} from "../src/volunteer-hours/types";

export interface StoredUser extends ManagedUser {
  password: string;
}

export interface Campaign {
  id: number;
  name: string;
  period: string;
  donations: number;
  status: "Ativa" | "Encerrada";
}

export interface AppData {
  patients: Patient[];
  appointments: Appointment[];
  notifications: AppNotification[];
  donations: Donation[];
  users: StoredUser[];
  campaigns: Campaign[];
  volunteerHours: VolunteerHourEntry[];
  volunteerAgenda: VolunteerAgendaItem[];
}

export function buildSeedData(): AppData {
  return {
    patients: [
      {
        id: DEMO_PATIENT_ID,
        name: DEMO_PATIENT_NAME,
        registrationDate: "2025-10-10",
        status: "pendente",
        priority: "alta",
        symptoms: "Nódulo detectado, necessita avaliação urgente",
      },
      {
        id: "pat-2",
        name: "Ana Souza",
        registrationDate: "2025-10-08",
        status: "encaminhado",
        priority: "media",
        symptoms: "Consulta de acompanhamento pós-cirurgia",
      },
      {
        id: "pat-3",
        name: "Carla Santos",
        registrationDate: "2025-10-05",
        status: "concluido",
        priority: "baixa",
        symptoms: "Exames de rotina - Resultados normais",
      },
      {
        id: "pat-4",
        name: "Beatriz Lima",
        registrationDate: "2025-10-12",
        status: "pendente",
        priority: "media",
        symptoms: "Primeira consulta - histórico familiar",
      },
    ],
    appointments: [
      {
        id: "apt-1",
        patientId: DEMO_PATIENT_ID,
        patientName: DEMO_PATIENT_NAME,
        date: "2026-04-22",
        time: "14:00",
        volunteerName: DEMO_VOLUNTEER_NAME,
        status: "concluido",
        observacoes:
          "Acolhimento inicial. Paciente recém-diagnosticada apresentou exames recentes e relatou dúvidas sobre o tratamento.",
        encaminhamento: "psicologia",
        encaminhamentoDetalhe:
          "Encaminhada ao grupo de apoio psicológico semanal.",
        createdAt: "2026-04-22T14:00:00.000Z",
        updatedAt: "2026-04-22T15:30:00.000Z",
      },
      {
        id: "apt-2",
        patientId: DEMO_PATIENT_ID,
        patientName: DEMO_PATIENT_NAME,
        date: "2026-05-02",
        time: "10:00",
        volunteerName: "Beatriz Voluntária",
        status: "concluido",
        observacoes:
          "Sessão de acompanhamento. Paciente relatou desconforto no ombro esquerdo. Demanda de fisioterapia identificada.",
        encaminhamento: "fisioterapia",
        encaminhamentoDetalhe: "Encaminhada para fisioterapia oncológica.",
        createdAt: "2026-05-02T10:00:00.000Z",
        updatedAt: "2026-05-02T11:00:00.000Z",
      },
      {
        id: "apt-3",
        patientId: DEMO_PATIENT_ID,
        patientName: DEMO_PATIENT_NAME,
        date: "2026-05-18",
        time: "09:30",
        volunteerName: DEMO_VOLUNTEER_NAME,
        status: "agendado",
        observacoes: "Próxima consulta de acompanhamento.",
        encaminhamento: null,
        createdAt: "2026-05-10T12:00:00.000Z",
        updatedAt: "2026-05-10T12:00:00.000Z",
      },
    ],
    notifications: [
      {
        id: "nt-1",
        recipientRole: "paciente",
        recipientId: DEMO_PATIENT_ID,
        type: "lembrete",
        title: "Lembrete de consulta",
        message:
          "Sua próxima consulta está agendada para 18/05/2026 às 09:30 com Ana Voluntária.",
        date: "2026-05-12T08:00:00.000Z",
        read: false,
      },
      {
        id: "nt-2",
        recipientRole: "paciente",
        recipientId: DEMO_PATIENT_ID,
        type: "atendimento",
        title: "Encaminhamento atualizado",
        message:
          "Seu atendimento de 02/05 foi atualizado: encaminhamento para fisioterapia oncológica.",
        date: "2026-05-02T11:00:00.000Z",
        read: false,
      },
      {
        id: "nt-3",
        recipientRole: "paciente",
        recipientId: DEMO_PATIENT_ID,
        type: "campanha",
        title: "Campanha Outubro Rosa",
        message:
          "Inscrições abertas para o evento Outubro Rosa 2026. Convide pessoas próximas.",
        date: "2026-04-25T09:00:00.000Z",
        read: true,
      },
    ],
    donations: [
      {
        id: "don-1",
        donorId: DEMO_DONOR_ID,
        donorName: DEMO_DONOR_NAME,
        kind: "financeira",
        date: "2026-03-10T10:00:00.000Z",
        status: "confirmada",
        amount: 50,
        campaign: "Outubro Rosa 2025",
        notes: "Doação via PIX.",
      },
      {
        id: "don-2",
        donorId: DEMO_DONOR_ID,
        donorName: DEMO_DONOR_NAME,
        kind: "material",
        date: "2026-03-02T14:30:00.000Z",
        status: "confirmada",
        itemType: "roupas",
        quantity: "5 peças",
        description: "Camisetas e blusas em bom estado.",
        deliveryMethod: "levar",
      },
      {
        id: "don-3",
        donorId: DEMO_DONOR_ID,
        donorName: DEMO_DONOR_NAME,
        kind: "financeira",
        date: "2026-04-15T09:15:00.000Z",
        status: "confirmada",
        amount: 100,
        campaign: "Campanha de Cabelos",
      },
      {
        id: "don-4",
        donorId: DEMO_DONOR_ID,
        donorName: DEMO_DONOR_NAME,
        kind: "material",
        date: "2026-05-05T11:00:00.000Z",
        status: "pendente",
        itemType: "higiene",
        quantity: "10 unidades",
        description: "Kits de higiene pessoal.",
        deliveryMethod: "retirada",
        notes: "Retirada agendada para o final do mês.",
      },
    ],
    users: [
      {
        id: 1,
        name: "Administrador",
        email: "admin@exemplo.com",
        cpf: "000.000.000-00",
        type: "admin",
        status: "Ativo",
        date: "01/08/2025",
        password: "123",
      },
      {
        id: 2,
        name: DEMO_VOLUNTEER_NAME,
        email: "voluntario@exemplo.com",
        cpf: "987.654.321-00",
        type: "voluntaria",
        status: "Ativo",
        date: "05/09/2025",
        password: "123",
      },
      {
        id: 3,
        name: DEMO_PATIENT_NAME,
        email: "paciente@exemplo.com",
        cpf: "123.456.789-09",
        type: "paciente",
        status: "Ativo",
        date: "10/10/2025",
        password: "123",
      },
      {
        id: 4,
        name: DEMO_DONOR_NAME,
        email: "doador@exemplo.com",
        cpf: "456.789.123-10",
        type: "doador",
        status: "Ativo",
        date: "15/08/2025",
        password: "123",
      },
    ],
    campaigns: [
      {
        id: 1,
        name: "Outubro Rosa 2025",
        period: "01/10 - 31/10/2025",
        donations: 45,
        status: "Ativa",
      },
      {
        id: 2,
        name: "Campanha de Cabelos",
        period: "01/09 - 30/11/2025",
        donations: 23,
        status: "Ativa",
      },
      {
        id: 3,
        name: "Natal Solidário 2024",
        period: "01/12 - 24/12/2024",
        donations: 67,
        status: "Encerrada",
      },
    ],
    volunteerHours: [
      {
        id: 1,
        activityName: "Apoio no balcão de atendimento",
        category: "acolhimento",
        date: "2026-04-03",
        hours: 3,
        location: "Sede Itapema",
        notes: "Recepção e orientação das pacientes no período da tarde.",
        createdAt: "2026-04-03T18:20:00.000Z",
      },
      {
        id: 2,
        activityName: "Organização de materiais da campanha",
        category: "campanha",
        date: "2026-04-05",
        hours: 2.5,
        location: "Sala de campanhas",
        notes: "Separação de folders e kits para ação externa.",
        createdAt: "2026-04-05T15:00:00.000Z",
      },
    ],
    volunteerAgenda: [
      {
        id: 1,
        title: "Plantão de acolhimento",
        date: "2026-04-09",
        shift: "08:00 - 12:00",
        location: "Recepção principal",
      },
      {
        id: 2,
        title: "Roda de conversa com pacientes",
        date: "2026-04-11",
        shift: "14:00 - 16:00",
        location: "Sala multiuso",
      },
      {
        id: 3,
        title: "Mutirão de organização do bazar",
        date: "2026-04-13",
        shift: "09:00 - 13:00",
        location: "Espaço de eventos",
      },
    ],
  };
}
