import { apiRequest } from "./api";
import type { Appointment, AppNotification } from "./types";

export function buildAppointmentId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `apt-${crypto.randomUUID()}`
    : `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function loadAppointments(): Promise<Appointment[]> {
  return apiRequest<Appointment[]>("/appointments");
}

export function saveAppointments(items: Appointment[]): Promise<Appointment[]> {
  return apiRequest<Appointment[]>("/appointments", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

export function loadNotifications(): Promise<AppNotification[]> {
  return apiRequest<AppNotification[]>("/notifications");
}

export function saveNotifications(
  items: AppNotification[],
): Promise<AppNotification[]> {
  return apiRequest<AppNotification[]>("/notifications", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}
