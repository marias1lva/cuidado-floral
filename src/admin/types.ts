export type ManagedUserRole = "admin" | "voluntaria" | "paciente" | "doador";
export type ManagedUserStatus = "Ativo" | "Inativo";

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  cpf: string;
  telefone?: string;
  type: ManagedUserRole;
  status: ManagedUserStatus;
  date: string;
}

// Payload de trânsito (modal → admin-area → API). password só preenchido em criação.
export interface ManagedUserPayload extends ManagedUser {
  password?: string;
}
