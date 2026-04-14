export type ManagedUserRole = "admin" | "voluntaria" | "paciente" | "doador";
export type ManagedUserStatus = "Ativo" | "Inativo";

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  cpf: string;
  type: ManagedUserRole;
  status: ManagedUserStatus;
  date: string;
}
