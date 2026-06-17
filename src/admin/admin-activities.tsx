import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  User2,
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
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { DatePicker } from "../ui/date-time-picker";
import {
  createVolunteerAgendaItem,
  deleteVolunteerAgendaItem,
  loadVolunteerAgenda,
  updateVolunteerAgendaItem,
} from "../domain/volunteer-data";
import type {
  VolunteerAgendaItem,
  VolunteerAgendaStatus,
} from "../volunteer-hours/types";

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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`));
}

export function AdminActivities() {
  const [items, setItems] = useState<VolunteerAgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<VolunteerAgendaItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  async function refresh() {
    try {
      const data = await loadVolunteerAgenda();
      setItems(data);
    } catch (error) {
      console.error("Falha ao carregar atividades", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(item: VolunteerAgendaItem) {
    setEditing(item);
    setIsModalOpen(true);
  }

  async function handleDelete(id: number) {
    try {
      await deleteVolunteerAgendaItem(id);
      setItems((current) => current.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Falha ao excluir atividade", error);
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.date.localeCompare(b.date)),
    [items],
  );

  return (
    <Card className="border-pink-100 bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100">
              <ClipboardList className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <CardTitle className="text-pink-600">
                Atividades das voluntárias
              </CardTitle>
              <CardDescription>
                Crie atividades abertas. Voluntárias recebem notificação e podem
                pegar pra si.
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={openCreate}
            className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova atividade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Carregando atividades...
          </p>
        ) : sorted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-pink-100 bg-pink-50/40 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Nenhuma atividade cadastrada. Crie a primeira clicando em "Nova
            atividade".
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sorted.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-pink-100 bg-pink-50/40 p-4"
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={statusBadgeClass[item.status]}
                    >
                      {statusLabel[item.status]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(item)}
                      className="rounded-full text-pink-700 hover:bg-pink-100"
                      aria-label="Editar atividade"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="rounded-full text-red-600 hover:bg-red-50"
                      aria-label="Excluir atividade"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} />
                    {formatDate(item.date)} · {item.shift}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {item.location}
                  </span>
                  {item.estimatedDuration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {item.estimatedDuration}
                    </span>
                  )}
                  {item.volunteerName && (
                    <span className="inline-flex items-center gap-1">
                      <User2 size={12} />
                      {item.volunteerName}
                    </span>
                  )}
                </div>
                {confirmDeleteId === item.id && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <span>Excluir esta atividade?</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-full text-red-700 hover:bg-red-100"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-full bg-red-600 text-white hover:bg-red-700"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <ActivityFormModal
        open={isModalOpen}
        editing={editing}
        onClose={() => setIsModalOpen(false)}
        onSaved={(item) => {
          setItems((current) => {
            const exists = current.some((i) => i.id === item.id);
            return exists
              ? current.map((i) => (i.id === item.id ? item : i))
              : [item, ...current];
          });
          setIsModalOpen(false);
        }}
      />
    </Card>
  );
}

interface ActivityFormModalProps {
  open: boolean;
  editing: VolunteerAgendaItem | null;
  onClose: () => void;
  onSaved: (item: VolunteerAgendaItem) => void;
}

function ActivityFormModal({
  open,
  editing,
  onClose,
  onSaved,
}: ActivityFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [shift, setShift] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? "");
      setDate(editing.date);
      setShift(editing.shift);
      setLocation(editing.location);
      setEstimatedDuration(editing.estimatedDuration ?? "");
    } else {
      setTitle("");
      setDescription("");
      setDate("");
      setShift("");
      setLocation("");
      setEstimatedDuration("");
    }
    setError(null);
  }, [open, editing]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !date || !shift.trim() || !location.trim()) {
      setError("Preencha título, data, turno e local.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        shift: shift.trim(),
        location: location.trim(),
        estimatedDuration: estimatedDuration.trim() || undefined,
      };
      const saved = editing
        ? await updateVolunteerAgendaItem(editing.id, payload)
        : await createVolunteerAgendaItem(payload);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar atividade.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar atividade" : "Nova atividade"}
      description={
        editing
          ? "Atualize os dados da atividade."
          : "Voluntárias serão notificadas e poderão pegar a atividade."
      }
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título *">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Plantão de acolhimento"
            className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
          />
        </Field>

        <Field label="Descrição">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="O que será feito, materiais necessários, observações..."
            className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data *">
            <DatePicker
              value={date}
              onChange={setDate}
              fromYear={new Date().getFullYear() - 1}
              toYear={new Date().getFullYear() + 2}
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
              required
            />
          </Field>
          <Field label="Turno *">
            <Input
              value={shift}
              onChange={(event) => setShift(event.target.value)}
              placeholder="Ex.: 08:00 - 12:00"
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Local *">
            <Input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Ex.: Sede Itapema"
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
            />
          </Field>
          <Field label="Tempo médio de demora">
            <Input
              value={estimatedDuration}
              onChange={(event) => setEstimatedDuration(event.target.value)}
              placeholder="Ex.: 2h, 3h30, meia hora"
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
            />
          </Field>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-pink-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border-pink-200"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-60"
          >
            {submitting
              ? "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Criar e notificar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}
