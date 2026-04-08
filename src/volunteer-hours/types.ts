export type VolunteerActivityCategory =
  | "acolhimento"
  | "evento"
  | "administrativo"
  | "visita"
  | "campanha";

export interface VolunteerHourEntry {
  id: number;
  activityName: string;
  category: VolunteerActivityCategory;
  date: string;
  hours: number;
  location: string;
  notes: string;
  createdAt: string;
}

export interface VolunteerAgendaItem {
  id: number;
  title: string;
  date: string;
  shift: string;
  location: string;
}
