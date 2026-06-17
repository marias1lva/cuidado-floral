import { Calendar, Clock3, HandHeart, MapPin, User2 } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import type { VolunteerAgendaItem, VolunteerAgendaStatus } from "./types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

const statusBadgeClass: Record<VolunteerAgendaStatus, string> = {
  aberta: "border-blue-200 bg-blue-50 text-blue-700",
  atribuida: "border-purple-200 bg-purple-50 text-purple-700",
  concluida: "border-green-200 bg-green-50 text-green-700",
  cancelada: "border-gray-200 bg-gray-50 text-gray-600",
};

const statusLabel: Record<VolunteerAgendaStatus, string> = {
  aberta: "Aberta",
  atribuida: "Atribuída",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

interface VolunteerAgendaProps {
  items: VolunteerAgendaItem[];
  /** ID do usuário logado (number do usuarios.id), usado pra destacar "minha". */
  currentVolunteerId?: number;
  /** Se passado, exibe botão "Pegar atividade" em items abertos. */
  onClaim?: (item: VolunteerAgendaItem) => void;
  claimingId?: number | null;
  emptyMessage?: string;
}

export function VolunteerAgenda({
  items,
  currentVolunteerId,
  onClaim,
  claimingId,
  emptyMessage = "Nenhuma atividade na agenda no momento.",
}: VolunteerAgendaProps) {
  return (
    <Card className="border-[var(--border)] bg-white gap-0">
      <CardHeader className="gap-1">
        <CardTitle className="text-base font-semibold text-[var(--primary)]">
          Agenda da voluntária
        </CardTitle>
        <CardDescription className="text-sm">
          Atividades disponíveis e atribuídas a você.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
            {emptyMessage}
          </div>
        )}
        {items.map((item) => {
          const isMine =
            currentVolunteerId !== undefined &&
            item.volunteerId === currentVolunteerId;
          const canClaim = item.status === "aberta" && Boolean(onClaim);

          return (
            <article
              key={item.id}
              className={`rounded-2xl border p-4 ${
                isMine
                  ? "border-purple-200 bg-purple-50/60"
                  : "border-pink-100 bg-pink-50/70"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <div className="flex flex-wrap items-center gap-1">
                  <Badge
                    variant="outline"
                    className={statusBadgeClass[item.status]}
                  >
                    {statusLabel[item.status]}
                  </Badge>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--primary)]">
                    {item.shift}
                  </span>
                </div>
              </div>
              {item.description && (
                <p className="mb-3 text-sm text-[var(--foreground)]">
                  {item.description}
                </p>
              )}
              <div className="flex flex-col gap-2 text-sm text-[var(--muted-foreground)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[var(--primary)]" />
                  {formatDate(item.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[var(--primary)]" />
                  {item.location}
                </span>
                {item.estimatedDuration && (
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={14} className="text-[var(--primary)]" />
                    {item.estimatedDuration}
                  </span>
                )}
                {item.volunteerName && (
                  <span className="flex items-center gap-1.5">
                    <User2 size={14} className="text-[var(--primary)]" />
                    {isMine ? "Você" : item.volunteerName}
                  </span>
                )}
              </div>
              {canClaim && (
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onClaim?.(item)}
                    disabled={claimingId === item.id}
                    className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                  >
                    <HandHeart className="mr-2 h-4 w-4" />
                    {claimingId === item.id ? "Pegando..." : "Pegar atividade"}
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
}
