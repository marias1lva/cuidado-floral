import { apiRequest } from "./api";
import type { Sector } from "./types";

export function loadSectors(): Promise<Sector[]> {
  return apiRequest<Sector[]>("/sectors");
}
