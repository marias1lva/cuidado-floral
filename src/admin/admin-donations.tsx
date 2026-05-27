import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  HandHeart,
  Package,
  Phone,
  PiggyBank,
  X,
} from "lucide-react";

import { loadDonations, saveDonations } from "../domain/donor-data";
import type { Donation, DonationKind, DonationStatus } from "../domain/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  deliveryMethodLabel,
  donationItemLabel,
  donationKindLabel,
  donationStatusLabel,
  formatCurrencyBRL,
  formatDateTimeBR,
} from "../user-area/donor/donor-utils";

// O admin vê "Pendente" em amber (aguardando ação), não "Em análise" em azul
const adminDonationStatusBadgeClass: Record<DonationStatus, string> = {
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  confirmada: "bg-green-50 text-green-700 border-green-200",
  cancelada: "bg-gray-100 text-gray-600 border-gray-200",
};

const adminDonationStatusLabel: Record<DonationStatus, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

type StatusFilter = "all" | DonationStatus;
type KindFilter = "all" | DonationKind;

export function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pendente");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    loadDonations()
      .then((data) => {
        if (!isMounted) return;
        setDonations(data.sort((a, b) => b.date.localeCompare(a.date)));
      })
      .catch((err) => console.error("Falha ao carregar doações", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      donations
        .filter((d) => statusFilter === "all" || d.status === statusFilter)
        .filter((d) => kindFilter === "all" || d.kind === kindFilter),
    [donations, statusFilter, kindFilter],
  );

  const pendingCount = donations.filter((d) => d.status === "pendente").length;

  const summary = useMemo(() => {
    const confirmed = donations.filter((d) => d.status === "confirmada");
    const totalAmount = confirmed
      .filter((d) => d.kind === "financeira")
      .reduce((sum, d) => sum + (d.amount ?? 0), 0);
    return {
      pending: pendingCount,
      confirmed: confirmed.length,
      totalAmount,
      material: donations.filter(
        (d) => d.kind === "material" && d.status === "confirmada",
      ).length,
    };
  }, [donations, pendingCount]);

  async function updateStatus(id: string, nextStatus: DonationStatus) {
    setSavingId(id);
    const updated = donations.map((d) =>
      d.id === id ? { ...d, status: nextStatus } : d,
    );
    try {
      await saveDonations(updated);
      setDonations(updated.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (err) {
      console.error("Falha ao salvar doação", err);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard
          label="Aguardando confirmação"
          value={summary.pending.toString()}
          icon={<CalendarDays className="h-5 w-5 text-amber-600" />}
          bg="bg-amber-50"
          border="border-amber-200"
          valueColor="text-amber-700"
          pulse={summary.pending > 0}
        />
        <SummaryCard
          label="Doações confirmadas"
          value={summary.confirmed.toString()}
          icon={<Check className="h-5 w-5 text-green-600" />}
          bg="bg-green-50"
          border="border-green-200"
          valueColor="text-green-700"
        />
        <SummaryCard
          label="Total financeiro confirmado"
          value={formatCurrencyBRL(summary.totalAmount)}
          icon={<PiggyBank className="h-5 w-5 text-pink-600" />}
          bg="bg-pink-50"
          border="border-pink-200"
          valueColor="text-pink-700"
        />
        <SummaryCard
          label="Materiais confirmados"
          value={summary.material.toString()}
          icon={<Package className="h-5 w-5 text-blue-600" />}
          bg="bg-blue-50"
          border="border-blue-200"
          valueColor="text-blue-700"
        />
      </div>

      {/* Table card */}
      <Card className="border-pink-100 bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-pink-600">
                Confirmação de Doações
              </CardTitle>
              <CardDescription>
                Revise e confirme ou cancele as doações recebidas pelo portal.
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <FilterSelect
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusFilter)}
                options={[
                  { value: "all", label: "Todos os status" },
                  { value: "pendente", label: "Pendentes" },
                  { value: "confirmada", label: "Confirmadas" },
                  { value: "cancelada", label: "Canceladas" },
                ]}
              />
              <FilterSelect
                value={kindFilter}
                onChange={(v) => setKindFilter(v as KindFilter)}
                options={[
                  { value: "all", label: "Todos os tipos" },
                  { value: "financeira", label: "Financeiras" },
                  { value: "material", label: "Materiais" },
                ]}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-300 border-t-pink-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-10 text-center">
              <HandHeart className="mx-auto mb-3 h-10 w-10 text-pink-300" />
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                Nenhuma doação encontrada com os filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((donation) => (
                <DonationRow
                  key={donation.id}
                  donation={donation}
                  isExpanded={expandedId === donation.id}
                  isSaving={savingId === donation.id}
                  onToggle={() =>
                    setExpandedId((prev) =>
                      prev === donation.id ? null : donation.id,
                    )
                  }
                  onConfirm={() => updateStatus(donation.id, "confirmada")}
                  onCancel={() => updateStatus(donation.id, "cancelada")}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── DonationRow ────────────────────────────────────────────────────────────────

interface DonationRowProps {
  donation: Donation;
  isExpanded: boolean;
  isSaving: boolean;
  onToggle: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function DonationRow({
  donation,
  isExpanded,
  isSaving,
  onToggle,
  onConfirm,
  onCancel,
}: DonationRowProps) {
  const isPending = donation.status === "pendente";

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all ${
        isPending
          ? "border-amber-200 bg-amber-50/30"
          : "border-pink-100 bg-white"
      }`}
    >
      {/* Summary row — always visible */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Kind icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            donation.kind === "financeira" ? "bg-pink-100" : "bg-blue-100"
          }`}
        >
          {donation.kind === "financeira" ? (
            <PiggyBank className="h-4 w-4 text-pink-600" />
          ) : (
            <Package className="h-4 w-4 text-blue-600" />
          )}
        </div>

        {/* Donor name + kind */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {donation.donorName}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {donationKindLabel[donation.kind]}
            {donation.kind === "financeira" && donation.amount
              ? ` · ${formatCurrencyBRL(donation.amount)}`
              : ""}
            {donation.kind === "material" && donation.itemType
              ? ` · ${donationItemLabel[donation.itemType]}`
              : ""}
          </p>
        </div>

        {/* Date */}
        <span className="hidden text-xs text-[var(--muted-foreground)] sm:block">
          {formatDateTimeBR(donation.date)}
        </span>

        {/* Status badge */}
        <Badge
          variant="outline"
          className={adminDonationStatusBadgeClass[donation.status]}
        >
          {adminDonationStatusLabel[donation.status]}
        </Badge>

        {/* Action buttons — only for pending */}
        {isPending && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              disabled={isSaving}
              className="h-7 rounded-full bg-green-500 px-3 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-60"
            >
              {isSaving ? (
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Salvando…
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Check size={12} />
                  Confirmar
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              disabled={isSaving}
              className="h-7 rounded-full border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <X size={12} className="mr-0.5" />
              Cancelar
            </Button>
          </div>
        )}

        {/* Expand toggle */}
        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label={isExpanded ? "Recolher detalhes" : "Ver detalhes"}
        >
          <ChevronDown
            size={15}
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-pink-100 bg-white px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <DetailItem label="Doador" value={donation.donorName} />

            {donation.donorPhone && (
              <DetailItem
                label="Telefone"
                value={
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-pink-500" />
                    {donation.donorPhone}
                  </span>
                }
              />
            )}

            <DetailItem
              label="Data"
              value={formatDateTimeBR(donation.date)}
            />

            <DetailItem
              label="Tipo"
              value={donationKindLabel[donation.kind]}
            />

            {donation.kind === "financeira" && (
              <DetailItem
                label="Valor"
                value={
                  donation.amount
                    ? formatCurrencyBRL(donation.amount)
                    : "A confirmar"
                }
              />
            )}

            {donation.kind === "material" && (
              <>
                {donation.itemType && (
                  <DetailItem
                    label="Item"
                    value={donationItemLabel[donation.itemType]}
                  />
                )}
                {donation.quantity && (
                  <DetailItem label="Quantidade" value={donation.quantity} />
                )}
                {donation.deliveryMethod && (
                  <DetailItem
                    label="Entrega"
                    value={deliveryMethodLabel[donation.deliveryMethod]}
                  />
                )}
                {donation.description && (
                  <DetailItem
                    label="Descrição"
                    value={donation.description}
                    full
                  />
                )}
              </>
            )}

            {donation.campaign && (
              <DetailItem label="Campanha" value={donation.campaign} />
            )}

            {donation.notes && (
              <DetailItem label="Observações" value={donation.notes} full />
            )}

            {donation.protocol && (
              <DetailItem label="Protocolo" value={donation.protocol} />
            )}

            <DetailItem
              label="Status atual"
              value={
                <Badge
                  variant="outline"
                  className={adminDonationStatusBadgeClass[donation.status]}
                >
                  {adminDonationStatusLabel[donation.status]}
                </Badge>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}

function DetailItem({ label, value, full }: DetailItemProps) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <span className="block text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </span>
      <span className="mt-0.5 block text-sm text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  valueColor: string;
  pulse?: boolean;
}

function SummaryCard({
  label,
  value,
  icon,
  bg,
  border,
  valueColor,
  pulse,
}: SummaryCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-4 shadow-sm ${bg} ${border}`}
    >
      {pulse && (
        <span className="absolute right-3 top-3 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
      )}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/70`}
        >
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}

interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ value, onChange, options }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-pink-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none transition-colors hover:border-pink-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
