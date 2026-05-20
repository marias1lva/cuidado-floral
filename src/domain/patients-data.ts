import { apiRequest } from "./api";
import type { Patient } from "./types";

export function loadPatients(): Promise<Patient[]> {
  return apiRequest<Patient[]>("/patients");
}

export function savePatients(items: Patient[]): Promise<Patient[]> {
  return apiRequest<Patient[]>("/patients", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}
