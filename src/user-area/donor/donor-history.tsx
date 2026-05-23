import { useMemo, useState } from "react";
import { Calendar, DollarSign, Download, Package, Receipt, Scissors } from "lucide-react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import type { Donation } from "../../domain/types";
import {
  donationItemLabel,
  donationKindLabel,
  donationStatusBadgeClass,
  donationStatusLabel,
  formatCurrencyBRL,
} from "./donor-utils";
import { DonationReceiptModal } from "./donation-receipt-modal";

interface DonorHistoryProps {
  donations: Donation[];
}

export function DonorHistory({ donations }: DonorHistoryProps) {
  const [receiptDonation, setReceiptDonation] = useState<Donation | null>(null);
  const filtered = useMemo(() => {
    return [...donations].sort((a, b) => b.date.localeCompare(a.date));
  }, [donations]);

  return (
    <section className="rounded-2xl border border-pink-100 bg-white p-7 shadow-sm shadow-pink-100/50">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--primary)]">
            Suas Doações
          </h2>
          <p className="text-lg text-[var(--muted-foreground)]">
            Histórico completo de suas contribuições
          </p>
        </div>

        <Button
          variant="outline"
          className="rounded-full border-pink-300 px-5 text-[var(--foreground)] hover:bg-pink-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
          Nenhuma doação encontrada com os filtros atuais.
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {filtered.map((donation) => (
            <li
              key={donation.id}
              className="rounded-2xl border border-pink-100 bg-pink-50/50 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex min-w-0 flex-1 items-center gap-5">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white ${
                      donation.kind === "financeira"
                        ? "text-green-600"
                        : donation.itemType === "cabelo"
                          ? "text-purple-600"
                          : "text-blue-600"
                    }`}
                  >
                    {renderDonationIcon(donation)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-medium text-[var(--foreground)]">
                        {renderDonationTitle(donation)}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-pink-200 bg-white text-[var(--foreground)]"
                      >
                        {renderDonationKind(donation)}
                      </Badge>
                    </div>
                    <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateBR(donation.date)}
                      </span>
                      <span>•</span>
                      {renderDonationDetail(donation)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <Badge
                    variant="outline"
                    className={donationStatusBadgeClass[donation.status]}
                  >
                    {renderDonationStatus(donation)}
                  </Badge>
                  {donation.protocol && (
                    <span className="rounded-full bg-pink-100 px-3 py-1 font-mono text-[11px] font-semibold text-pink-700">
                      {donation.protocol}
                    </span>
                  )}
                  {donation.kind === "financeira" && donation.protocol ? (
                    <Button
                      variant="outline"
                      onClick={() => setReceiptDonation(donation)}
                      className="rounded-full border-pink-300 bg-white px-5 text-[var(--foreground)] hover:bg-pink-50"
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Comprovante
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="rounded-full border-pink-300 bg-white px-5 text-[var(--muted-foreground)]"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Comprovante
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DonationReceiptModal
        donation={receiptDonation}
        open={receiptDonation !== null}
        onClose={() => setReceiptDonation(null)}
      />
    </section>
  );
}

function renderDonationIcon(donation: Donation) {
  if (donation.kind === "financeira") {
    return <DollarSign className="h-6 w-6" />;
  }
  if (donation.itemType === "cabelo") {
    return <Scissors className="h-6 w-6" />;
  }
  return <Package className="h-6 w-6" />;
}

function renderDonationTitle(donation: Donation): string {
  if (donation.kind === "financeira") {
    return donation.campaign
      ? `Doação para ${donation.campaign.replace(" 2025", "")}`
      : "Contribuição financeira";
  }
  if (donation.itemType === "cabelo") {
    return "Doação de cabelo";
  }
  return donation.itemType ? donationItemLabel[donation.itemType] : "Doação material";
}

function renderDonationKind(donation: Donation): string {
  if (donation.itemType === "cabelo") {
    return "Cabelo";
  }
  return donationKindLabel[donation.kind];
}

function renderDonationStatus(donation: Donation): string {
  if (donation.kind === "material" && donation.status === "confirmada") {
    return donation.itemType === "cabelo" ? "Processada" : "Recebida";
  }
  return donationStatusLabel[donation.status];
}

function renderDonationDetail(donation: Donation): string {
  if (donation.kind === "financeira") {
    if (donation.amount && donation.amount > 0) {
      return formatCurrencyBRL(donation.amount);
    }
    return "Valor a confirmar";
  }
  const parts: string[] = [];
  if (donation.itemType) {
    parts.push(donationItemLabel[donation.itemType]);
  }
  if (donation.quantity) {
    parts.push(donation.quantity);
  }
  return parts.join(" · ") || "Material doado";
}

function formatDateBR(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("pt-BR").format(date);
}
