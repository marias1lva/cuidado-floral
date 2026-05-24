import type { ManagedUser } from "../admin/types";
import { apiRequest } from "./api";

export type CampaignStatus = "Ativa" | "Encerrada";

export interface Campaign {
  id: number;
  name: string;
  period: string;
  donations: number;
  status: CampaignStatus;
}

export function loadManagedUsers(): Promise<ManagedUser[]> {
  return apiRequest<ManagedUser[]>("/users");
}

export function loadUser(userId: number): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/users/${userId}`);
}

export function saveManagedUsers(items: ManagedUser[]): Promise<ManagedUser[]> {
  return apiRequest<ManagedUser[]>("/users", {
    method: "PUT",
    body: JSON.stringify(items),
  });
}

export function saveUser(item: ManagedUser): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/users/${item.id}`, {
    method: "PUT",
    body: JSON.stringify(item),
  });
}

export function loadCampaigns(): Promise<Campaign[]> {
  return apiRequest<Campaign[]>("/campaigns");
}
