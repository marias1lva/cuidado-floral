import type { VolunteerAgendaItem, VolunteerActivityCategory, VolunteerHourEntry } from "./types";

export const activityCategoryOptions: Array<{
  value: VolunteerActivityCategory;
  label: string;
}> = [
  { value: "acolhimento", label: "Acolhimento" },
  { value: "evento", label: "Evento" },
  { value: "administrativo", label: "Administrativo" },
  { value: "visita", label: "Visita" },
  { value: "campanha", label: "Campanha" },
];

export const initialVolunteerHours: VolunteerHourEntry[] = [
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
];

export const volunteerAgenda: VolunteerAgendaItem[] = [
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
];
