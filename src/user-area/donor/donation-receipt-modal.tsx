import { FileDown, Receipt } from "lucide-react";

import { Button } from "../../ui/button";
import { Dialog } from "../../ui/dialog";
import type { Donation } from "../../domain/types";
import { downloadPdfReport, type CsvColumn } from "../../domain/reports";
import {
  donationStatusLabel,
  formatCurrencyBRL,
  formatDateTimeBR,
  donationSourceLabel,
} from "./donor-utils";

interface DonationReceiptModalProps {
  donation: Donation | null;
  open: boolean;
  onClose: () => void;
}

export function DonationReceiptModal({
  donation,
  open,
  onClose,
}: DonationReceiptModalProps) {
  if (!open || !donation) return null;

  const protocol = donation.protocol ?? "—";
  const issuedAt = donation.receiptIssuedAt
    ? formatDateTimeBR(donation.receiptIssuedAt)
    : formatDateTimeBR(donation.date);
  const amountText =
    donation.amount && donation.amount > 0
      ? formatCurrencyBRL(donation.amount)
      : "Valor a confirmar";

  function handleDownloadPdf() {
    if (!donation) return;
    const columns: CsvColumn<{ label: string; value: string }>[] = [
      { header: "Campo", value: (row) => row.label },
      { header: "Informação", value: (row) => row.value },
    ];
    const rows = [
      { label: "Protocolo", value: protocol },
      { label: "Emitido em", value: issuedAt },
      { label: "Doador", value: donation.donorName },
      { label: "Telefone", value: donation.donorPhone ?? "—" },
      {
        label: "Origem",
        value: donationSourceLabel[donation.donorSource ?? "titular"],
      },
      { label: "Tipo de doação", value: "Financeira" },
      { label: "Valor", value: amountText },
      { label: "Campanha", value: donation.campaign ?? "—" },
      { label: "Status", value: donationStatusLabel[donation.status] },
    ];
    downloadPdfReport(
      `comprovante-${protocol}.pdf`,
      {
        title: `Comprovante de Doação — ${protocol}`,
        subtitle:
          "Este comprovante confirma o registro da intenção de doação financeira.",
      },
      [{ title: "Dados da doação", columns, rows }],
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Comprovante de doação"
      description={`Protocolo ${protocol}`}
      className="max-w-lg"
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
              <Receipt className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-pink-600">
                Protocolo
              </p>
              <p className="font-mono text-lg font-semibold text-[var(--primary)]">
                {protocol}
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Emitido em {issuedAt}
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Field label="Doador" value={donation.donorName} />
          <Field label="Telefone" value={donation.donorPhone ?? "—"} />
          <Field
            label="Origem"
            value={donationSourceLabel[donation.donorSource ?? "titular"]}
          />
          <Field label="Tipo" value="Financeira" />
          <Field label="Valor" value={amountText} />
          <Field
            label="Campanha"
            value={donation.campaign ?? "Sem campanha vinculada"}
          />
          <Field label="Status" value={donationStatusLabel[donation.status]} />
        </dl>

        <div className="rounded-xl border border-pink-100 bg-white p-4 text-xs text-[var(--muted-foreground)]">
          Guarde este protocolo. Em caso de dúvidas sobre a confirmação da
          doação, informe-o à equipe Cuidado Floral.
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="rounded-full"
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handleDownloadPdf}
            className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-pink-100 bg-white px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}
