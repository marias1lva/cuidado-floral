export type VolunteerActivityCategory =
  | "acolhimento"
  | "evento"
  | "administrativo"
  | "visita"
  | "campanha";

export interface VolunteerHourEntry {
  id: number;
  volunteerId?: string;
  volunteerName: string;
  activityName: string;
  category: VolunteerActivityCategory;
  date: string;
  hours: number;
  location: string;
  notes: string;
  createdAt: string;
}

export type VolunteerAgendaStatus =
  | "aberta"
  | "atribuida"
  | "concluida"
  | "cancelada";

export interface VolunteerAgendaItem {
  id: number;
  title: string;
  description?: string;
  date: string;
  shift: string;
  location: string;
  estimatedDuration?: string; // texto livre, ex.: "2h", "3h30"
  status: VolunteerAgendaStatus;
  volunteerId?: number;
  volunteerName?: string;
}

// Payload de criação (sem id, status default aberta).
export interface VolunteerAgendaCreate {
  title: string;
  description?: string;
  date: string;
  shift: string;
  location: string;
  estimatedDuration?: string;
}
