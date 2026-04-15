// Tipos para o fluxo de doação

export type DonationType = "financeira" | "material" | null;

export type DeliveryMethod = "levar" | "retirada";

export type ItemType =
  | "roupas"
  | "cabelo"
  | "alimentos"
  | "higiene"
  | "medicamentos"
  | "outros";

export interface FinancialDonationForm {
  nome: string;
  telefone: string;
  valorEstimado: string;
}

export interface MaterialDonationForm {
  nome: string;
  telefone: string;
  tipoItem: ItemType | "";
  quantidade: string;
  descricao: string;
  formaEntrega: DeliveryMethod | "";
  observacoes: string;
}

export type DonationStep = "escolha" | "financeira" | "material" | "confirmacao";
