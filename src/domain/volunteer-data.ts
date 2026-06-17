import type {
  VolunteerAgendaCreate,
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

export function createVolunteerAgendaItem(
  payload: VolunteerAgendaCreate,
): Promise<VolunteerAgendaItem> {
  return apiRequest<VolunteerAgendaItem>("/volunteer-agenda", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateVolunteerAgendaItem(
  id: number,
  payload: VolunteerAgendaCreate,
): Promise<VolunteerAgendaItem> {
  return apiRequest<VolunteerAgendaItem>(`/volunteer-agenda/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteVolunteerAgendaItem(id: number): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/volunteer-agenda/${id}`, {
    method: "DELETE",
  });
}

export function claimVolunteerAgendaItem(
  id: number,
): Promise<VolunteerAgendaItem> {
  return apiRequest<VolunteerAgendaItem>(`/volunteer-agenda/${id}/claim`, {
    method: "POST",
  });
}
