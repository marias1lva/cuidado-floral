import type {
  VolunteerAgendaItem,
  VolunteerHourEntry,
} from "../volunteer-hours/types";
import { apiRequest } from "./api";

export function loadVolunteerHours(): Promise<VolunteerHourEntry[]> {
  return apiRequest<VolunteerHourEntry[]>("/volunteer-hours");
}

export function saveVolunteerHours(
  items: VolunteerHourEntry[],
): Promise<VolunteerHourEntry[]> {
  return apiRequest<VolunteerHourEntry[]>("/volunteer-hours", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

export function loadVolunteerAgenda(): Promise<VolunteerAgendaItem[]> {
  return apiRequest<VolunteerAgendaItem[]>("/volunteer-agenda");
}
