import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  Download,
  Package,
  Receipt,
  Scissors,
  XCircle,
} from "lucide-react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import type { Donation } from "../../domain/types";
import { buildCsv, downloadCsv, type CsvColumn } from "../../domain/reports";
import {
  donationItemLabel,
  donationKindLabel,
  donationStatusBadgeClass,
  donationStatusLabel,
  donationSourceLabel,
  formatCurrencyBRL,
  formatDateTimeBR,
} from "./donor-utils";
import { DonationReceiptModal } from "./donation-receipt-modal";

interface DonorHistoryProps {
  donations: Donation[];
}

export function DonorHistory({ donations }: DonorHistoryProps) {
  const [receiptDonation, setReceiptDonation] = useState<Donation | null>(null);

  const filtered = useMemo(
    () => [...donations].sort((a, b) => b.date.localeCompare(a.date)),
    [donations],
  );

  const exportColumns: CsvColumn<Donation>[] = [
    { header: "Data", value: (row) => formatDateTimeBR(row.date) },
    { header: "Tipo", value: (row) => donationKindLabel[row.kind] },
    { header: "Status", value: (row) => donationStatusLabel[row.status] },
    {
      header: "Origem",
      value: (row) => donationSourceLabel[row.donorSource ?? "titular"],
    },
    { header: "Campanha", value: (row) => row.campaign ?? "" },
    {
      header: "Valor",
      value: (row) =>
        row.amount !== undefined ? row.amount.toFixed(2).replace(".", ",") : "",
    },
    {
      header: "Item",
      value: (row) => (row.itemType ? donationItemLabel[row.itemType] : ""),
    },
    { header: "Quantidade", value: (row) => row.quantity ?? "" },
    { header: "Entrega", value: (row) => row.deliveryMethod ?? "" },
    { header: "Protocolo", value: (row) => row.protocol ?? "" },
    { header: "Observações", value: (row) => row.notes ?? "" },
  ];

  function handleExport() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `minhas-doacoes-${stamp}.csv`,
      buildCsv(filtered, exportColumns),
    );
  }

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
          onClick={handleExport}
          disabled={filtered.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
          Nenhuma doação encontrada.
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {filtered.map((donation) => (
            <DonationCard
              key={donation.id}
              donation={donation}
              onViewReceipt={() => setReceiptDonation(donation)}
            />
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

// ── DonationCard ──────────────────────────────────────────────────────────────

interface DonationCardProps {
  donation: Donation;
  onViewReceipt: () => void;
}

function DonationCard({ donation, onViewReceipt }: DonationCardProps) {
  const isPending = donation.status === "pendente";
  const isCancelled = donation.status === "cancelada";

  return (
    <li
      className={`rounded-2xl border p-6 transition-colors ${
        isPending
          ? "border-blue-100 bg-blue-50/30"
          : isCancelled
            ? "border-gray-200 bg-gray-50/50 opacity-75"
            : "border-pink-100 bg-pink-50/50"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-5">
        {/* Left: icon + title + date */}
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white ${
              isCancelled
                ? "text-gray-400"
                : donation.kind === "financeira"
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
              <span>
                {donationSourceLabel[donation.donorSource ?? "titular"]}
              </span>
              <span>•</span>
              {renderDonationDetail(donation)}
            </p>
          </div>
        </div>

        {/* Right: status badge + protocol + action button */}
        <div className="flex shrink-0 flex-col items-end gap-3">
          <Badge
            variant="outline"
            className={donationStatusBadgeClass[donation.status]}
          >
            {/* Ícone contextual dentro do badge */}
            {isPending && <Clock className="mr-1 h-3 w-3" />}
            {isCancelled && <XCircle className="mr-1 h-3 w-3" />}
            {renderDonationStatus(donation)}
          </Badge>

          {donation.protocol && (
            <span className="rounded-full bg-pink-100 px-3 py-1 font-mono text-[11px] font-semibold text-pink-700">
              {donation.protocol}
            </span>
          )}

          {/* Comprovante — só habilitado quando confirmada e com protocolo */}
          {donation.kind === "financeira" &&
          donation.protocol &&
          !isPending &&
          !isCancelled ? (
            <Button
              variant="outline"
              onClick={onViewReceipt}
              className="rounded-full border-pink-300 bg-white px-5 text-[var(--foreground)] hover:bg-pink-50"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Comprovante
            </Button>
          ) : donation.kind === "financeira" ? (
            <Button
              variant="outline"
              disabled
              title={
                isPending
                  ? "Disponível após confirmação da doação"
                  : isCancelled
                    ? "Doação cancelada"
                    : "Protocolo não disponível"
              }
              className="rounded-full border-pink-200 bg-white px-5 text-[var(--muted-foreground)] opacity-50"
            >
              <Receipt className="mr-2 h-4 w-4" />
              Comprovante
            </Button>
          ) : null}
        </div>
      </div>

      {/* Aviso contextual para pendente e cancelada */}
      {isPending && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Sua doação foi recebida e está sendo analisada pela equipe. Em breve
          você receberá uma confirmação.
        </div>
      )}

      {isCancelled && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          Esta doação foi cancelada. Entre em contato com a equipe se tiver
          dúvidas.
        </div>
      )}
    </li>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  return donation.itemType
    ? donationItemLabel[donation.itemType]
    : "Doação material";
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
  // donationStatusLabel já mapeia "pendente" → "Em análise"
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
  if (donation.itemType) parts.push(donationItemLabel[donation.itemType]);
  if (donation.quantity) parts.push(donation.quantity);
  return parts.join(" · ") || "Material doado";
}

function formatDateBR(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}
