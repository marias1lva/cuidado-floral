import { apiRequest } from "./api";
import type { Donation } from "./types";

export function loadDonations(): Promise<Donation[]> {
  return apiRequest<Donation[]>("/donations");
}

export function saveDonations(items: Donation[]): Promise<Donation[]> {
  return apiRequest<Donation[]>("/donations", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

export function buildDonationId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `don-${crypto.randomUUID()}`
    : `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
