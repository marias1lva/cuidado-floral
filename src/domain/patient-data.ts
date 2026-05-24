import { apiRequest, getAuthToken, setAuthToken } from "./api";
import type {
  Appointment,
  AppNotification,
  AppointmentAttachment,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export function buildAppointmentId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `apt-${crypto.randomUUID()}`
    : `apt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function buildNotificationId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `nt-${crypto.randomUUID()}`
    : `nt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

export async function uploadAttachments(
  files: File[],
): Promise<AppointmentAttachment[]> {
  if (files.length === 0) return [];
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append(`file${index}`, file, file.name);
  });
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (response.status === 401) {
    setAuthToken(null);
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? "Falha ao enviar os arquivos.");
  }
  return (await response.json()) as AppointmentAttachment[];
}
