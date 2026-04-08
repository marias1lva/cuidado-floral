import { Calendar, MapPin } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import type { VolunteerAgendaItem } from "./types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

interface VolunteerAgendaProps {
  items: VolunteerAgendaItem[];
}

export function VolunteerAgenda({ items }: VolunteerAgendaProps) {
  return (
    <Card className="border-[var(--border)] bg-white gap-0">
      <CardHeader className="gap-1">
        <CardTitle className="text-base font-semibold text-[var(--primary)]">
          Agenda da voluntária
        </CardTitle>
        <CardDescription className="text-sm">
          Próximas atividades disponíveis para organização da rotina.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-pink-100 bg-pink-50/70 p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {item.title}
              </h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--primary)]">
                {item.shift}
              </span>
            </div>
            <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[var(--primary)]" />
                {formatDate(item.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[var(--primary)]" />
                {item.location}
              </span>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
