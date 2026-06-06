import type {
  DonationDeliveryMethod,
  DonationItemType,
  DonationKind,
  DonationStatus,
} from "../../domain/types";

export const donationKindLabel: Record<DonationKind, string> = {
  financeira: "Financeira",
  material: "Material",
};

export const donationStatusLabel: Record<DonationStatus, string> = {
  pendente: "Em análise", // ← Admin vê "Pendente"; doador vê "Em análise"
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export const donationStatusBadgeClass: Record<DonationStatus, string> = {
  pendente: "bg-blue-50 text-blue-700 border-blue-200", // ← era amber; azul transmite "aguardando"
  confirmada: "bg-green-50 text-green-700 border-green-200",
  cancelada: "bg-gray-100 text-gray-600 border-gray-200",
};

export const donationSourceLabel: Record<"titular" | "terceiro", string> = {
  titular: "Titular do perfil",
  terceiro: "Terceiro usando o perfil",
};

export const donationItemLabel: Record<DonationItemType, string> = {
  roupas: "Roupas",
  cabelo: "Cabelo",
  alimentos: "Alimentos",
  higiene: "Higiene pessoal",
  medicamentos: "Medicamentos",
  outros: "Outros",
};

export const deliveryMethodLabel: Record<DonationDeliveryMethod, string> = {
  levar: "Vou levar",
  retirada: "Retirada",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyBRL(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDateTimeBR(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
