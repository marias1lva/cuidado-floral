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

// Protocolo legível para impressão e referência humana (RN13).
// Formato: CF-AAAAMMDD-XXXX (rosa = identificador interno, sufixo aleatório).
export function buildDonationProtocol(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `CF-${yyyy}${mm}${dd}-${random}`;
}
