import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock,
  Download,
  FileDown,
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
import { DatePicker } from "../ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { loadAppointments } from "../domain/patient-data";
import { loadDonations } from "../domain/donor-data";
import { loadVolunteerHours } from "../domain/volunteer-data";
import {
  buildCsv,
  consolidateVolunteerHoursByVolunteer,
  downloadCsv,
  downloadPdfReport,
  isWithinRange,
  summarizeAppointments,
  summarizeDonations,
  summarizeVolunteerHours,
  type CsvColumn,
  type DateRange,
  type VolunteerConsolidation,
} from "../domain/reports";
import type {
  Appointment,
  AppointmentStatus,
  Donation,
  DonationKind,
  DonationStatus,
} from "../domain/types";
import type { VolunteerHourEntry } from "../volunteer-hours/types";
import { activityCategoryOptions } from "../volunteer-hours/constants";
import {
  appointmentStatusBadgeClass,
  appointmentStatusLabel,
  formatDateBR,
  referralLabel,
} from "../user-area/patient/patient-utils";
import {
  donationItemLabel,
  donationKindLabel,
  donationSourceLabel,
  donationStatusBadgeClass,
  donationStatusLabel,
  formatCurrencyBRL,
  formatDateTimeBR,
} from "../user-area/donor/donor-utils";

const categoryLabelMap: Record<string, string> = Object.fromEntries(
  activityCategoryOptions.map((opt) => [opt.value, opt.label]),
);

type AppointmentStatusFilter = "all" | AppointmentStatus;
type DonationKindFilter = "all" | DonationKind;
type DonationStatusFilter = "all" | DonationStatus;
type DonationSourceFilter = "all" | "titular" | "terceiro";

export function AdminReports() {
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [allVolunteerHours, setAllVolunteerHours] = useState<
    VolunteerHourEntry[]
  >([]);

  const [range, setRange] = useState<DateRange>({});
  const [appointmentStatus, setAppointmentStatus] =
    useState<AppointmentStatusFilter>("all");
  const [donationKind, setDonationKind] = useState<DonationKindFilter>("all");
  const [donationStatus, setDonationStatus] =
    useState<DonationStatusFilter>("all");
  const [donationSource, setDonationSource] =
    useState<DonationSourceFilter>("all");

  // Hoje em ISO local (YYYY-MM-DD) — usado como teto dos filtros pra impedir
  // recortes em datas futuras (relatórios são sempre históricos).
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  // Se um "Até" inválido ficar no estado (ex.: era >= "De" e o usuário muda "De"
  // pra uma data posterior), zera. Mesmo raciocínio se "Até" estiver no futuro.
  useEffect(() => {
    if (range.to && range.from && range.to < range.from) {
      setRange((current) => ({ ...current, to: undefined }));
    }
  }, [range.from, range.to]);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      loadAppointments(),
      loadDonations(),
      loadVolunteerHours(),
    ])
      .then(([appointments, donations, hours]) => {
        if (!isMounted) return;
        setAllAppointments(appointments);
        setAllDonations(donations);
        setAllVolunteerHours(hours);
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
        .filter(
          (d) =>
            donationSource === "all" ||
            (d.donorSource ?? "titular") === donationSource,
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allDonations, range, donationKind, donationStatus, donationSource],
  );

  const filteredVolunteerHours = useMemo(
    () =>
      allVolunteerHours
        .filter((h) => isWithinRange(h.date, range))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allVolunteerHours, range],
  );

  const appointmentsSummary = useMemo(
    () => summarizeAppointments(filteredAppointments),
    [filteredAppointments],
  );
  const donationsSummary = useMemo(
    () => summarizeDonations(filteredDonations),
    [filteredDonations],
  );
  const volunteerHoursSummary = useMemo(
    () => summarizeVolunteerHours(filteredVolunteerHours),
    [filteredVolunteerHours],
  );
  const volunteerConsolidation = useMemo(
    () => consolidateVolunteerHoursByVolunteer(filteredVolunteerHours),
    [filteredVolunteerHours],
  );

  // Colunas reutilizadas para CSV e PDF
  const appointmentColumns: CsvColumn<Appointment>[] = [
    { header: "Data", value: (row) => formatDateBR(row.date) },
    { header: "Horário", value: (row) => row.time ?? "" },
    { header: "Paciente", value: (row) => row.patientName },
    { header: "Voluntária", value: (row) => row.volunteerName },
    { header: "Status", value: (row) => appointmentStatusLabel[row.status] },
    {
      header: "Encaminhamento",
      value: (row) =>
        row.encaminhamento ? referralLabel[row.encaminhamento] : "",
    },
    { header: "Observações", value: (row) => row.observacoes },
  ];

  const donationColumns: CsvColumn<Donation>[] = [
    { header: "Data", value: (row) => formatDateTimeBR(row.date) },
    { header: "Doador", value: (row) => row.donorName },
    { header: "Telefone", value: (row) => row.donorPhone ?? "" },
    {
      header: "Origem",
      value: (row) => donationSourceLabel[row.donorSource ?? "titular"],
    },
    {
      header: "Perfil utilizado",
      value: (row) => row.profileOwnerName ?? row.donorName,
    },
    {
      header: "ID perfil",
      value: (row) => row.profileOwnerId ?? row.donorId,
    },
    {
      header: "Terceiro",
      value: (row) =>
        (row.donorSource ?? "titular") === "terceiro"
          ? (row.thirdPartyName ?? row.donorName)
          : "",
    },
    {
      header: "Telefone terceiro",
      value: (row) =>
        (row.donorSource ?? "titular") === "terceiro"
          ? (row.thirdPartyPhone ?? row.donorPhone ?? "")
          : "",
    },
    { header: "Tipo", value: (row) => donationKindLabel[row.kind] },
    { header: "Status", value: (row) => donationStatusLabel[row.status] },
    { header: "Campanha", value: (row) => row.campaign ?? "" },
    {
      header: "Valor",
      value: (row) =>
        typeof row.amount === "number"
          ? row.amount.toFixed(2).replace(".", ",")
          : "",
    },
    {
      header: "Item",
      value: (row) => (row.itemType ? donationItemLabel[row.itemType] : ""),
    },
    { header: "Quantidade", value: (row) => row.quantity ?? "" },
  ];

  const volunteerHoursColumns: CsvColumn<VolunteerHourEntry>[] = [
    { header: "Data", value: (row) => formatDateBR(row.date) },
    { header: "Voluntária", value: (row) => row.volunteerName },
    { header: "Atividade", value: (row) => row.activityName },
    {
      header: "Categoria",
      value: (row) => categoryLabelMap[row.category] ?? row.category,
    },
    { header: "Local", value: (row) => row.location },
    { header: "Horas", value: (row) => row.hours.toFixed(1).replace(".", ",") },
    { header: "Observações", value: (row) => row.notes },
  ];

  const volunteerConsolidationColumns: CsvColumn<VolunteerConsolidation>[] = [
    { header: "Voluntária", value: (row) => row.volunteerName },
    {
      header: "Total de horas",
      value: (row) => `${row.totalHours.toFixed(1).replace(".", ",")} h`,
    },
    { header: "Registros", value: (row) => row.entries },
    { header: "Atividades", value: (row) => row.activities.join("; ") },
    {
      header: "Período",
      value: (row) =>
        row.periodStart && row.periodEnd
          ? `${formatDateBR(row.periodStart)} a ${formatDateBR(row.periodEnd)}`
          : "",
    },
  ];

  function todayStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function handleExportAppointmentsCsv() {
    downloadCsv(
      `atendimentos-${todayStamp()}.csv`,
      buildCsv(filteredAppointments, appointmentColumns),
    );
  }

  function handleExportDonationsCsv() {
    downloadCsv(
      `doacoes-${todayStamp()}.csv`,
      buildCsv(filteredDonations, donationColumns),
    );
  }

  function handleExportVolunteerHoursCsv() {
    downloadCsv(
      `horas-voluntariado-${todayStamp()}.csv`,
      buildCsv(filteredVolunteerHours, volunteerHoursColumns),
    );
  }

  function handleExportAppointmentsPdf() {
    downloadPdfReport(
      `atendimentos-${todayStamp()}.pdf`,
      {
        title: "Relatório de Atendimentos",
        period: range,
        summary: [
          {
            label: "Atendimentos",
            value: appointmentsSummary.total.toString(),
          },
          {
            label: "Pacientes únicas",
            value: appointmentsSummary.uniquePatients.toString(),
          },
          {
            label: "Encaminhamentos",
            value: appointmentsSummary.withReferral.toString(),
          },
          {
            label: "Concluídos",
            value: appointmentsSummary.byStatus.concluido.toString(),
          },
        ],
      },
      [
        {
          title: "Atendimentos",
          columns: appointmentColumns,
          rows: filteredAppointments,
        },
      ],
    );
  }

  function handleExportDonationsPdf() {
    downloadPdfReport(
      `doacoes-${todayStamp()}.pdf`,
      {
        title: "Relatório de Doações",
        period: range,
        summary: [
          { label: "Doações", value: donationsSummary.total.toString() },
          {
            label: "Total arrecadado",
            value: formatCurrencyBRL(donationsSummary.totalAmount),
          },
          {
            label: "Doadores únicos",
            value: donationsSummary.uniqueDonors.toString(),
          },
          {
            label: "Financeiras / Materiais",
            value: `${donationsSummary.byKind.financeira} / ${donationsSummary.byKind.material}`,
          },
        ],
      },
      [{ title: "Doações", columns: donationColumns, rows: filteredDonations }],
    );
  }

  function handleExportVolunteerHoursPdf() {
    const categoriesSummary = Object.entries(
      volunteerHoursSummary.byCategory,
    ).map(([category, hours]) => ({
      label: categoryLabelMap[category] ?? category,
      value: `${hours.toFixed(1).replace(".", ",")} h`,
    }));

    downloadPdfReport(
      `horas-voluntariado-${todayStamp()}.pdf`,
      {
        title: "Relatório de Horas de Voluntariado",
        period: range,
        summary: [
          {
            label: "Total de horas",
            value: `${volunteerHoursSummary.totalHours.toFixed(1).replace(".", ",")} h`,
          },
          {
            label: "Registros",
            value: volunteerHoursSummary.totalEntries.toString(),
          },
          {
            label: "Voluntárias ativas",
            value: volunteerConsolidation.length.toString(),
          },
          {
            label: "Atividades distintas",
            value: volunteerHoursSummary.uniqueActivities.toString(),
          },
          ...categoriesSummary,
        ],
      },
      [
        {
          title: "Consolidado por voluntária",
          columns: volunteerConsolidationColumns,
          rows: volunteerConsolidation,
        },
        {
          title: "Horas registradas (detalhe)",
          columns: volunteerHoursColumns,
          rows: filteredVolunteerHours,
        },
      ],
    );
  }

  function handleExportVolunteerConsolidationCsv() {
    downloadCsv(
      `horas-por-voluntaria-${todayStamp()}.csv`,
      buildCsv(volunteerConsolidation, volunteerConsolidationColumns),
    );
  }

  function handleClearFilters() {
    setRange({});
    setAppointmentStatus("all");
    setDonationKind("all");
    setDonationStatus("all");
    setDonationSource("all");
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <FilterField label="De">
              <DatePicker
                value={range.from ?? ""}
                onChange={(value) =>
                  setRange((current) => ({
                    ...current,
                    from: value || undefined,
                  }))
                }
                fromYear={new Date().getFullYear() - 5}
                toYear={new Date().getFullYear()}
                max={range.to ?? todayIso}
                className="rounded-xl border-pink-200 bg-[var(--input-background)]"
              />
            </FilterField>
            <FilterField label="Até">
              <DatePicker
                value={range.to ?? ""}
                onChange={(value) =>
                  setRange((current) => ({
                    ...current,
                    to: value || undefined,
                  }))
                }
                fromYear={new Date().getFullYear() - 5}
                toYear={new Date().getFullYear()}
                min={range.from}
                max={todayIso}
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
                onValueChange={(value) =>
                  setDonationKind(value as DonationKindFilter)
                }
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
            <FilterField label="Origem da doação">
              <Select
                value={donationSource}
                onValueChange={(value) =>
                  setDonationSource(value as DonationSourceFilter)
                }
              >
                <SelectTrigger className="rounded-xl border-pink-200 bg-[var(--input-background)] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="titular">Titular do perfil</SelectItem>
                  <SelectItem value="terceiro">Terceiro</SelectItem>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          <SummaryCard
            label="Horas de voluntariado"
            value={`${volunteerHoursSummary.totalHours.toFixed(1).replace(".", ",")} h`}
            hint={`${volunteerHoursSummary.totalEntries} registros`}
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-100"
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
                {filteredAppointments.length === 1 ? "registro" : "registros"}{" "}
                no recorte.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleExportAppointmentsCsv}
              disabled={filteredAppointments.length === 0}
              className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportAppointmentsPdf}
              disabled={filteredAppointments.length === 0}
              className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <FileDown size={14} />
              PDF
            </Button>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Nenhum atendimento encontrado com os filtros atuais.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-pink-100">
            <div className="pretty-scrollbar overflow-x-auto">
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
                      <td className="px-3 py-2 align-top">
                        {appointment.patientName}
                      </td>
                      <td className="px-3 py-2 align-top text-[var(--muted-foreground)]">
                        {appointment.volunteerName}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <Badge
                          variant="outline"
                          className={
                            appointmentStatusBadgeClass[appointment.status]
                          }
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
              <h2 className="text-lg font-semibold text-[var(--primary)]">
                Doações
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {filteredDonations.length}{" "}
                {filteredDonations.length === 1 ? "registro" : "registros"} no
                recorte · {formatCurrencyBRL(donationsSummary.totalAmount)}{" "}
                arrecadados.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleExportDonationsCsv}
              disabled={filteredDonations.length === 0}
              className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportDonationsPdf}
              disabled={filteredDonations.length === 0}
              className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <FileDown size={14} />
              PDF
            </Button>
          </div>
        </div>

        {filteredDonations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Nenhuma doação encontrada com os filtros atuais.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-pink-100">
            <div className="pretty-scrollbar overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-100 text-slate-800">
                    <th className="px-3 py-2 font-semibold">Data</th>
                    <th className="px-3 py-2 font-semibold">Doador</th>
                    <th className="px-3 py-2 font-semibold">Origem</th>
                    <th className="px-3 py-2 font-semibold">Perfil usado</th>
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
                      <td className="px-3 py-2 align-top">
                        {donation.donorName}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {donationSourceLabel[donation.donorSource ?? "titular"]}
                      </td>
                      <td className="px-3 py-2 align-top text-[var(--muted-foreground)]">
                        {donation.profileOwnerName ?? donation.donorName}
                      </td>
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

      <section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm shadow-pink-100/40">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--primary)]">
                Horas de voluntariado
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {filteredVolunteerHours.length}{" "}
                {filteredVolunteerHours.length === 1 ? "registro" : "registros"}{" "}
                ·{" "}
                {volunteerHoursSummary.totalHours.toFixed(1).replace(".", ",")}{" "}
                h no recorte.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleExportVolunteerHoursCsv}
              disabled={filteredVolunteerHours.length === 0}
              className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportVolunteerHoursPdf}
              disabled={filteredVolunteerHours.length === 0}
              className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <FileDown size={14} />
              PDF
            </Button>
          </div>
        </div>

        {filteredVolunteerHours.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Nenhuma hora de voluntariado encontrada no recorte atual.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-pink-100">
            <div className="pretty-scrollbar overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-100 text-slate-800">
                    <th className="px-3 py-2 font-semibold">Data</th>
                    <th className="px-3 py-2 font-semibold">Voluntária</th>
                    <th className="px-3 py-2 font-semibold">Atividade</th>
                    <th className="px-3 py-2 font-semibold">Categoria</th>
                    <th className="px-3 py-2 font-semibold">Local</th>
                    <th className="px-3 py-2 font-semibold text-right">
                      Horas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteerHours.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-t border-pink-100 hover:bg-pink-50/60"
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {formatDateBR(entry.date)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {entry.volunteerName}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {entry.activityName}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-800"
                        >
                          {categoryLabelMap[entry.category] ?? entry.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-top text-[var(--muted-foreground)]">
                        {entry.location}
                      </td>
                      <td className="px-3 py-2 align-top text-right font-semibold text-amber-700">
                        {entry.hours.toFixed(1).replace(".", ",")} h
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--primary)]">
                Consolidado por voluntária
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {volunteerConsolidation.length}{" "}
                {volunteerConsolidation.length === 1
                  ? "voluntária ativa"
                  : "voluntárias ativas"}{" "}
                no recorte (RN12).
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExportVolunteerConsolidationCsv}
            disabled={volunteerConsolidation.length === 0}
            className="rounded-full border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <Download size={14} />
            CSV consolidado
          </Button>
        </div>

        {volunteerConsolidation.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Nenhuma voluntária com registros no recorte atual.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-pink-100">
            <div className="pretty-scrollbar overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-100 text-slate-800">
                    <th className="px-3 py-2 font-semibold">Voluntária</th>
                    <th className="px-3 py-2 font-semibold text-right">
                      Total
                    </th>
                    <th className="px-3 py-2 font-semibold text-right">
                      Registros
                    </th>
                    <th className="px-3 py-2 font-semibold">Atividades</th>
                    <th className="px-3 py-2 font-semibold">Período</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteerConsolidation.map((row) => (
                    <tr
                      key={row.volunteerName}
                      className="border-t border-pink-100 hover:bg-pink-50/60"
                    >
                      <td className="px-3 py-2 align-top font-semibold">
                        {row.volunteerName}
                      </td>
                      <td className="px-3 py-2 align-top text-right font-semibold text-amber-700 whitespace-nowrap">
                        {row.totalHours.toFixed(1).replace(".", ",")} h
                      </td>
                      <td className="px-3 py-2 align-top text-right text-[var(--muted-foreground)]">
                        {row.entries}
                      </td>
                      <td className="px-3 py-2 align-top text-[var(--muted-foreground)]">
                        {row.activities.length > 0 ? (
                          <ul className="list-disc pl-4">
                            {row.activities.slice(0, 4).map((act) => (
                              <li key={act}>{act}</li>
                            ))}
                            {row.activities.length > 4 && (
                              <li className="italic">
                                +{row.activities.length - 4} outras
                              </li>
                            )}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-[var(--muted-foreground)] whitespace-nowrap">
                        {row.periodStart && row.periodEnd
                          ? `${formatDateBR(row.periodStart)} a ${formatDateBR(row.periodEnd)}`
                          : "—"}
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
      <span className="mb-1 block font-medium text-[var(--foreground)]">
        {label}
      </span>
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

function SummaryCard({
  label,
  value,
  hint,
  icon,
  iconBg = "bg-pink-100",
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm shadow-pink-100/40">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {label}
        </span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-[var(--primary)]">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p>
      )}
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
