import { CalendarDays, Clock3, MapPin } from "lucide-react";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { activityCategoryOptions } from "./constants";
import type { VolunteerHourEntry } from "./types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getCategoryLabel(category: VolunteerHourEntry["category"]) {
  return (
    activityCategoryOptions.find((option) => option.value === category)?.label ??
    category
  );
}

interface VolunteerHoursListProps {
  entries: VolunteerHourEntry[];
}

export function VolunteerHoursList({ entries }: VolunteerHoursListProps) {
  return (
    <Card className="border-[var(--border)] bg-white gap-0">
      <CardHeader className="gap-1">
        <CardTitle className="text-base font-semibold text-[var(--primary)]">
          Horas registradas
        </CardTitle>
        <CardDescription className="text-sm">
          Histórico local das atividades cadastradas pela voluntária.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/60 px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
            Nenhuma hora registrada ainda.
          </div>
        )}

        {entries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-pink-100 bg-[var(--secondary)] p-4"
          >
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {entry.activityName}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {entry.notes || "Sem observações adicionais."}
                </p>
              </div>
              <Badge
                variant="outline"
                className="w-fit border-pink-200 bg-white text-[var(--primary)]"
              >
                {getCategoryLabel(entry.category)}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-[var(--primary)]" />
                {formatDate(entry.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 size={14} className="text-[var(--primary)]" />
                {entry.hours}h registradas
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[var(--primary)]" />
                {entry.location}
              </span>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
