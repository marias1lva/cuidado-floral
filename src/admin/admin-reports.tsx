import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Download,
  HandHeart,
  PiggyBank,
  Send,
  Users,
} from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { loadAppointments } from "../domain/patient-data";
import { loadDonations } from "../domain/donor-data";
import {
  buildCsv,
  downloadCsv,
  isWithinRange,
  summarizeAppointments,
  summarizeDonations,
  type CsvColumn,
  type DateRange,
} from "../domain/reports";
import type {
  Appointment,
  AppointmentStatus,
  Donation,
  DonationKind,
  DonationStatus,
} from "../domain/types";
import {
  appointmentStatusBadgeClass,
  appointmentStatusLabel,
  formatDateBR,
  referralLabel,
} from "../user-area/patient/patient-utils";
import {
  donationItemLabel,
  donationKindLabel,
  donationStatusBadgeClass,
  donationStatusLabel,
  formatCurrencyBRL,
  formatDateTimeBR,
} from "../user-area/donor/donor-utils";

type AppointmentStatusFilter = "all" | AppointmentStatus;
type DonationKindFilter = "all" | DonationKind;
type DonationStatusFilter = "all" | DonationStatus;

export function AdminReports() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);

  const [range, setRange] = useState<DateRange>({});
  const [appointmentStatus, setAppointmentStatus] =
    useState<AppointmentStatusFilter>("all");
  const [donationKind, setDonationKind] = useState<DonationKindFilter>("all");
  const [donationStatus, setDonationStatus] =
    useState<DonationStatusFilter>("all");

  // Carrega dos repositórios. Re-carrega ao trocar a aba via key na admin-area.
  useEffect(() => {
    let isMounted = true;

    void Promise.all([loadAppointments(), loadDonations()])
      .then(([appointments, donations]) => {
        if (!isMounted) return;
        setAllAppointments(appointments);
        setAllDonations(donations);
      })
      .catch((error) => {
        console.error("Falha ao carregar relatórios", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAppointments = useMemo(
    () =>
      allAppointments
        .filter((a) => isWithinRange(a.date, range))
        .filter(
          (a) => appointmentStatus === "all" || a.status === appointmentStatus,
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allAppointments, range, appointmentStatus],
  );

  const filteredDonations = useMemo(
    () =>
      allDonations
        .filter((d) => isWithinRange(d.date, range))
        .filter((d) => donationKind === "all" || d.kind === donationKind)
        .filter((d) => donationStatus === "all" || d.status === donationStatus)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allDonations, range, donationKind, donationStatus],
  );

  const appointmentsSummary = useMemo(
    () => summarizeAppointments(filteredAppointments),
    [filteredAppointments],
  );
  const donationsSummary = useMemo(
    () => summarizeDonations(filteredDonations),
    [filteredDonations],
  );

  function handleExportAppointments() {
    const columns: CsvColumn<Appointment>[] = [
      { header: "Data", value: (row) => formatDateBR(row.date) },
      { header: "Horário", value: (row) => row.time ?? "" },
      { header: "Paciente", value: (row) => row.patientName },
      { header: "Voluntária", value: (row) => row.volunteerName },
      { header: "Status", value: (row) => appointmentStatusLabel[row.status] },
      {
        header: "Encaminhamento",
        value: (row) => (row.encaminhamento ? referralLabel[row.encaminhamento] : ""),
      },
      { header: "Detalhe encaminhamento", value: (row) => row.encaminhamentoDetalhe ?? "" },
      { header: "Observações", value: (row) => row.observacoes },
    ];
    downloadCsv(
      `atendimentos-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsv(filteredAppointments, columns),
    );
  }

  function handleExportDonations() {
    const columns: CsvColumn<Donation>[] = [
      { header: "Data", value: (row) => formatDateTimeBR(row.date) },
      { header: "Doador", value: (row) => row.donorName },
      { header: "Telefone", value: (row) => row.donorPhone ?? "" },
      { header: "Tipo", value: (row) => donationKindLabel[row.kind] },
      { header: "Status", value: (row) => donationStatusLabel[row.status] },
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
      { header: "Descrição", value: (row) => row.description ?? "" },
    ];
    downloadCsv(
      `doacoes-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsv(filteredDonations, columns),
    );
  }

  function handleClearFilters() {
    setRange({});
    setAppointmentStatus("all");
    setDonationKind("all");
    setDonationStatus("all");
  }

  return (
    <div className="space-y-6">
      <Card className="border-pink-100 bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-pink-600">Filtros</CardTitle>
              <CardDescription>
                Refine os relatórios por período, status e tipo.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="rounded-full border-pink-200 text-pink-700 hover:bg-pink-50"
            >
              Limpar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <FilterField label="De">
              <Input
                type="date"
                value={range.from ?? ""}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    from: event.target.value || undefined,
                  }))
                }
                className="rounded-xl border-pink-200 bg-[var(--input-background)]"
              />
            </FilterField>
            <FilterField label="Até">
              <Input
                type="date"
                value={range.to ?? ""}
                onChange={(event) =>
                  setRange((current) => ({
                    ...current,
                    to: event.target.value || undefined,
                  }))
                }
                className="rounded-xl border-pink-200 bg-[var(--input-background)]"
              />
            </FilterField>
            <FilterField label="Status do atendimento">
              <Select
                value={appointmentStatus}
                onValueChange={(value) =>
                  setAppointmentStatus(value as AppointmentStatusFilter)
                }
              >
                <SelectTrigger className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="encaminhado">Encaminhado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Tipo de doação">
              <Select
                value={donationKind}
                onValueChange={(value) => setDonationKind(value as DonationKindFilter)}
              >
                <SelectTrigger className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="financeira">Financeira</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Status da doação">
              <Select
                value={donationStatus}
                onValueChange={(value) =>
                  setDonationStatus(value as DonationStatusFilter)
                }
              >
                <SelectTrigger className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </div>
        </CardContent>
      </Card>

      <section>
        <header className="mb-3">
          <h2 className="text-lg font-semibold text-pink-600">
            Indicadores resumidos
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Totais calculados sobre os filtros aplicados.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Atendimentos no período"
            value={appointmentsSummary.total.toString()}
            hint={`${appointmentsSummary.uniquePatients} pacientes únicas`}
            icon={<ClipboardList className="h-5 w-5 text-pink-600" />}
          />
          <SummaryCard
            label="Encaminhamentos"
            value={appointmentsSummary.withReferral.toString()}
            hint={`${appointmentsSummary.byStatus.concluido} concluídos`}
            icon={<Send className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-100"
          />
          <SummaryCard
            label="Doações no período"
            value={donationsSummary.total.toString()}
            hint={`${donationsSummary.byKind.financeira} financeiras · ${donationsSummary.byKind.material} materiais`}
            icon={<HandHeart className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-100"
          />
          <SummaryCard
            label="Total financeiro"
            value={formatCurrencyBRL(donationsSummary.totalAmount)}
            hint={`${donationsSummary.uniqueDonors} doadores únicos`}
            icon={<PiggyBank className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-100"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm shadow-pink-100/40">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
              <Activity className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--primary)]">
                Atendimentos
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {filteredAppointments.length}{" "}
                {filteredAppointments.length === 1 ? "registro" : "registros"} no recorte.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExportAppointments}
            disabled={filteredAppointments.length === 0}
            className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <Download size={14} />
            Exportar CSV
          </Button>
        </div>

        {filteredAppointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Nenhum atendimento encontrado com os filtros atuais.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-pink-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-100 text-slate-800">
                    <th className="px-3 py-2 font-semibold">Data</th>
                    <th className="px-3 py-2 font-semibold">Paciente</th>
                    <th className="px-3 py-2 font-semibold">Voluntária</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Encaminhamento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="border-t border-pink-100 hover:bg-pink-50/60"
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <div>{formatDateBR(appointment.date)}</div>
                        {appointment.time && (
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {appointment.time}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">{appointment.patientName}</td>
                      <td className="px-3 py-2 align-top text-[var(--muted-foreground)]">
                        {appointment.volunteerName}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <Badge
                          variant="outline"
                          className={appointmentStatusBadgeClass[appointment.status]}
                        >
                          {appointmentStatusLabel[appointment.status]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-top text-[var(--muted-foreground)]">
                        {appointment.encaminhamento ? (
                          <span className="inline-flex items-center gap-1">
                            <ArrowRight size={12} />
                            {referralLabel[appointment.encaminhamento]}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm shadow-pink-100/40">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
              <Users className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--primary)]">Doações</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {filteredDonations.length}{" "}
                {filteredDonations.length === 1 ? "registro" : "registros"} no recorte ·{" "}
                {formatCurrencyBRL(donationsSummary.totalAmount)} arrecadados.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExportDonations}
            disabled={filteredDonations.length === 0}
            className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <Download size={14} />
            Exportar CSV
          </Button>
        </div>

        {filteredDonations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Nenhuma doação encontrada com os filtros atuais.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-pink-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-100 text-slate-800">
                    <th className="px-3 py-2 font-semibold">Data</th>
                    <th className="px-3 py-2 font-semibold">Doador</th>
                    <th className="px-3 py-2 font-semibold">Tipo</th>
                    <th className="px-3 py-2 font-semibold">Detalhe</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map((donation) => (
                    <tr
                      key={donation.id}
                      className="border-t border-pink-100 hover:bg-pink-50/60"
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <CalendarDays size={12} className="text-pink-500" />
                          {formatDateTimeBR(donation.date)}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">{donation.donorName}</td>
                      <td className="px-3 py-2 align-top">
                        {donationKindLabel[donation.kind]}
                      </td>
                      <td className="px-3 py-2 align-top text-[var(--muted-foreground)]">
                        {renderDonationDetail(donation)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <Badge
                          variant="outline"
                          className={donationStatusBadgeClass[donation.status]}
                        >
                          {donationStatusLabel[donation.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  iconBg?: string;
}

function SummaryCard({ label, value, hint, icon, iconBg = "bg-pink-100" }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm shadow-pink-100/40">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-[var(--primary)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

function renderDonationDetail(donation: Donation): string {
  if (donation.kind === "financeira") {
    return donation.amount && donation.amount > 0
      ? formatCurrencyBRL(donation.amount)
      : "Valor a confirmar";
  }
  const parts: string[] = [];
  if (donation.itemType) parts.push(donationItemLabel[donation.itemType]);
  if (donation.quantity) parts.push(donation.quantity);
  if (donation.description) parts.push(donation.description);
  return parts.join(" · ") || "—";
}
