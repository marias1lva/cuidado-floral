// Tipos de domínio centrais do app Cuidado Floral.
// Mantidos no front-end por enquanto (sem backend). Quando houver API,
// estes tipos serão a fonte da verdade do contrato.

export type RoleId = "admin" | "voluntaria" | "paciente" | "doador";

export type PatientWorkflowStatus = "pendente" | "encaminhado" | "concluido";

export type PatientPriority = "alta" | "media" | "baixa";

export interface Patient {
  id: string;
  name: string;
  registrationDate: string; // YYYY-MM-DD
  status: PatientWorkflowStatus;
  priority: PatientPriority;
  symptoms: string;
}

export type AppointmentStatus =
  | "agendado"
  | "em_andamento"
  | "concluido"
  | "encaminhado"
  | "cancelado";

export type AppointmentAuthor = "paciente" | "voluntaria";

export interface AppointmentAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number; // bytes
  url: string; // /uploads/<folder>/<file>
  uploadedAt: string; // ISO datetime
}

export type AppointmentReferral =
  | "mastologista"
  | "psicologia"
  | "fisioterapia"
  | "assistencia_social"
  | "nutricao"
  | "outro"
  | null;

export interface Sector {
  id: string;
  name: string;
  // slug bate com AppointmentReferral quando aplicável; fora isso vira "outro"
  slug: NonNullable<AppointmentReferral>;
  description?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  volunteerName: string;
  professionalName?: string; // médico ou clínica externa (atendimento registrado pela paciente)
  status: AppointmentStatus;
  observacoes: string;
  encaminhamento: AppointmentReferral;
  encaminhamentoDetalhe?: string;
  attachments?: AppointmentAttachment[];
  createdBy?: AppointmentAuthor;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export type DonationKind = "financeira" | "material";

export type DonationStatus = "pendente" | "confirmada" | "cancelada";

export type DonationItemType =
  | "roupas"
  | "cabelo"
  | "alimentos"
  | "higiene"
  | "medicamentos"
  | "outros";

export type DonationDeliveryMethod = "levar" | "retirada";

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone?: string;
  kind: DonationKind;
  date: string; // ISO datetime
  status: DonationStatus;
  campaign?: string;
  // financeira
  amount?: number; // em reais
  // material
  itemType?: DonationItemType;
  quantity?: string;
  description?: string;
  deliveryMethod?: DonationDeliveryMethod;
  notes?: string;
}

export type NotificationType =
  | "atendimento"
  | "campanha"
  | "lembrete"
  | "geral";

export interface AppNotification {
  id: string;
  recipientRole: RoleId;
  recipientId?: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string; // ISO datetime
  read: boolean;
}
