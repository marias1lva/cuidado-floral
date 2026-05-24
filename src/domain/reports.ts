// Helpers para gerar relatórios e exportar CSV.
// Pensados para serem reutilizados quando houver API: a lógica de agregação
// continua igual; só a fonte dos dados muda.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  Appointment,
  AppointmentStatus,
  Donation,
  DonationKind,
  DonationStatus,
} from "./types";
import type { VolunteerHourEntry } from "../volunteer-hours/types";

export interface DateRange {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

function toIsoDay(input: string): string {
  return input.length <= 10 ? input : input.slice(0, 10);
}

export function isWithinRange(date: string, range: DateRange): boolean {
  const day = toIsoDay(date);
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export interface AppointmentsSummary {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
  withReferral: number;
  uniquePatients: number;
}

export function summarizeAppointments(items: Appointment[]): AppointmentsSummary {
  const byStatus: Record<AppointmentStatus, number> = {
    agendado: 0,
    em_andamento: 0,
    concluido: 0,
    encaminhado: 0,
    cancelado: 0,
  };
  const patients = new Set<string>();
  let withReferral = 0;

  items.forEach((item) => {
    byStatus[item.status] += 1;
    patients.add(item.patientId);
    if (item.encaminhamento) withReferral += 1;
  });

  return {
    total: items.length,
    byStatus,
    withReferral,
    uniquePatients: patients.size,
  };
}

export interface DonationsSummary {
  total: number;
  byKind: Record<DonationKind, number>;
  byStatus: Record<DonationStatus, number>;
  totalAmount: number;
  uniqueDonors: number;
}

export interface VolunteerHoursSummary {
  totalEntries: number;
  totalHours: number;
  uniqueActivities: number;
  byCategory: Record<string, number>;
}

export interface VolunteerConsolidation {
  volunteerName: string;
  totalHours: number;
  entries: number;
  activities: string[];
  periodStart?: string; // YYYY-MM-DD
  periodEnd?: string; // YYYY-MM-DD
}

export function consolidateVolunteerHoursByVolunteer(
  items: VolunteerHourEntry[],
): VolunteerConsolidation[] {
  const map = new Map<
    string,
    {
      totalHours: number;
      entries: number;
      activities: Set<string>;
      periodStart?: string;
      periodEnd?: string;
    }
  >();

  items.forEach((entry) => {
    const key = entry.volunteerName || "(não atribuído)";
    const current = map.get(key) ?? {
      totalHours: 0,
      entries: 0,
      activities: new Set<string>(),
    };
    current.totalHours += entry.hours;
    current.entries += 1;
    current.activities.add(entry.activityName);
    if (!current.periodStart || entry.date < current.periodStart) {
      current.periodStart = entry.date;
    }
    if (!current.periodEnd || entry.date > current.periodEnd) {
      current.periodEnd = entry.date;
    }
    map.set(key, current);
  });

  return Array.from(map.entries())
    .map(([volunteerName, data]) => ({
      volunteerName,
      totalHours: data.totalHours,
      entries: data.entries,
      activities: Array.from(data.activities).sort(),
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    }))
    .sort((a, b) => b.totalHours - a.totalHours);
}

export function summarizeVolunteerHours(
  items: VolunteerHourEntry[],
): VolunteerHoursSummary {
  const byCategory: Record<string, number> = {};
  const activities = new Set<string>();
  let totalHours = 0;
  items.forEach((entry) => {
    totalHours += entry.hours;
    activities.add(entry.activityName);
    byCategory[entry.category] = (byCategory[entry.category] ?? 0) + entry.hours;
  });
  return {
    totalEntries: items.length,
    totalHours,
    uniqueActivities: activities.size,
    byCategory,
  };
}

export function summarizeDonations(items: Donation[]): DonationsSummary {
  const byKind: Record<DonationKind, number> = { financeira: 0, material: 0 };
  const byStatus: Record<DonationStatus, number> = {
    pendente: 0,
    confirmada: 0,
    cancelada: 0,
  };
  const donors = new Set<string>();
  let totalAmount = 0;

  items.forEach((item) => {
    byKind[item.kind] += 1;
    byStatus[item.status] += 1;
    donors.add(item.donorId);
    if (item.kind === "financeira" && item.amount) {
      totalAmount += item.amount;
    }
  });

  return {
    total: items.length,
    byKind,
    byStatus,
    totalAmount,
    uniqueDonors: donors.size,
  };
}

// ── CSV ───────────────────────────────────────────────

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | undefined | null;
}

function escapeCsvValue(raw: string | number | undefined | null): string {
  if (raw === null || raw === undefined) return "";
  const text = String(raw);
  if (/[",;\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(";");
  const body = rows
    .map((row) =>
      columns.map((column) => escapeCsvValue(column.value(row))).join(";"),
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadCsv(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  // BOM para abrir corretamente no Excel
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── PDF ───────────────────────────────────────────────

export interface PdfReportSection<T> {
  title: string;
  columns: CsvColumn<T>[];
  rows: T[];
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  period?: DateRange;
  summary?: Array<{ label: string; value: string }>;
}

function formatPeriodLabel(period?: DateRange): string {
  if (!period || (!period.from && !period.to)) {
    return "Sem filtro de período";
  }
  const fmt = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? iso
      : new Intl.DateTimeFormat("pt-BR").format(date);
  };
  if (period.from && period.to) return `${fmt(period.from)} a ${fmt(period.to)}`;
  if (period.from) return `A partir de ${fmt(period.from)}`;
  return `Até ${fmt(period.to!)}`;
}

export function downloadPdfReport(
  filename: string,
  options: PdfReportOptions,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections: PdfReportSection<any>[],
): void {
  if (typeof window === "undefined") return;

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const PAGE_MARGIN = 40;
  let cursorY = PAGE_MARGIN;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(233, 30, 99); // pink-600
  doc.text("Cuidado Floral", PAGE_MARGIN, cursorY);
  cursorY += 22;

  doc.setFontSize(14);
  doc.setTextColor(60);
  doc.text(options.title, PAGE_MARGIN, cursorY);
  cursorY += 16;

  doc.setFontSize(10);
  doc.setTextColor(120);
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
  doc.text(`Gerado em ${generatedAt}`, PAGE_MARGIN, cursorY);
  cursorY += 12;
  doc.text(`Período: ${formatPeriodLabel(options.period)}`, PAGE_MARGIN, cursorY);
  cursorY += 16;

  if (options.subtitle) {
    doc.setTextColor(80);
    doc.text(options.subtitle, PAGE_MARGIN, cursorY);
    cursorY += 14;
  }

  // Resumo (indicadores) — tabela simples chave/valor
  if (options.summary && options.summary.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [["Indicador", "Valor"]],
      body: options.summary.map((row) => [row.label, row.value]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [233, 30, 99], textColor: 255 },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    // @ts-expect-error autotable acrescenta lastAutoTable em runtime
    cursorY = doc.lastAutoTable.finalY + 18;
  }

  // Tabelas de cada seção
  sections.forEach((section, index) => {
    if (index > 0) cursorY += 8;

    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(section.title, PAGE_MARGIN, cursorY);
    cursorY += 8;

    if (section.rows.length === 0) {
      cursorY += 6;
      doc.setFontSize(10);
      doc.setTextColor(140);
      doc.text("Sem registros no recorte atual.", PAGE_MARGIN, cursorY);
      cursorY += 16;
      return;
    }

    autoTable(doc, {
      startY: cursorY,
      head: [section.columns.map((column) => column.header)],
      body: section.rows.map((row) =>
        section.columns.map((column) => {
          const raw = column.value(row);
          return raw === undefined || raw === null ? "" : String(raw);
        }),
      ),
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [255, 192, 203], textColor: 60 },
      alternateRowStyles: { fillColor: [255, 245, 248] },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    // @ts-expect-error autotable acrescenta lastAutoTable em runtime
    cursorY = doc.lastAutoTable.finalY + 14;
  });

  doc.save(filename);
}
