import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Calendar,
  FileText,
  MapPin,
  Paperclip,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import {
  buildAppointmentId,
  loadAppointments,
  loadNotifications,
  loadPatientProfile,
  saveAppointments,
  saveNotifications,
  savePatientProfile,
  uploadAttachments,
} from "../../domain/patient-data";
import type {
  Appointment,
  AppNotification,
  PatientProfile,
} from "../../domain/types";
import { PatientNotifications } from "./patient-notifications";
import { PatientAppointmentsTimeline } from "./patient-appointments-timeline";
import { formatDateBR } from "./patient-utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { DatePicker, TimePicker } from "../../ui/date-time-picker";
import { Dialog } from "../../ui/dialog";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import { getLoggedUser } from "../../domain/auth";
import { formatPhoneBR } from "../../donation-page/phone-format";
import { formatCpf } from "../../lib/cpf-format";

function normalizeProfileDate(value: string) {
  if (!value) {
    return "";
  }

  if (value.includes("/")) {
    const [day, month, year] = value.split("/");
    if (day && month && year) {
      return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return value;
}

interface PatientDashboardProps {
  currentPatientName?: string;
  onPatientNameChange?: (name: string) => void;
}

export function PatientDashboard({
  currentPatientName,
  onPatientNameChange,
}: PatientDashboardProps) {
  const loggedUser = getLoggedUser();
  const patientId = loggedUser ? `pat-${loggedUser.sub}` : "";
  const sessionPatientName = loggedUser ? loggedUser.name : "";
  const patientUserId = loggedUser ? loggedUser.sub : 0;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(
    null,
  );
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [hasLoadedAppointments, setHasLoadedAppointments] = useState(false);
  const [hasLoadedNotifications, setHasLoadedNotifications] = useState(false);
  const patientName =
    patientProfile?.name ?? currentPatientName ?? sessionPatientName;

  useEffect(() => {
    let isMounted = true;

    void Promise.all([loadAppointments(), loadNotifications()])
      .then(([loadedAppointments, loadedNotifications]) => {
        if (!isMounted) return;
        setAppointments(loadedAppointments);
        setNotifications(loadedNotifications);
        setHasLoadedAppointments(true);
        setHasLoadedNotifications(true);
      })
      .catch((error) => {
        console.error("Falha ao carregar dados da paciente", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!patientUserId) return;

    void loadPatientProfile()
      .then((loadedProfile) => {
        if (!isMounted) return;
        setPatientProfile(loadedProfile);
        if (onPatientNameChange) onPatientNameChange(loadedProfile.name);
      })
      .catch((error) => {
        console.error("Falha ao carregar perfil da paciente", error);
      });

    return () => {
      isMounted = false;
    };
  }, [patientUserId, onPatientNameChange]);

  const patientAppointments = useMemo(
    () => appointments.filter((apt) => apt.patientId === patientId),
    [appointments, patientId],
  );

  const patientNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.recipientRole === "paciente" &&
          (!notification.recipientId || notification.recipientId === patientId),
      ),
    [notifications, patientId],
  );

  useEffect(() => {
    if (!hasLoadedNotifications) return;
    void saveNotifications(notifications).catch((error) => {
      console.error("Falha ao salvar notificações", error);
    });
  }, [notifications, hasLoadedNotifications]);

  useEffect(() => {
    if (!hasLoadedAppointments) return;
    void saveAppointments(appointments).catch((error) => {
      console.error("Falha ao salvar atendimentos", error);
    });
  }, [appointments, hasLoadedAppointments]);

  async function handleSaveAppointment(appointment: Appointment) {
    const nextAppointments = [appointment, ...appointments];
    setAppointments(nextAppointments);

    try {
      await saveAppointments(nextAppointments);
    } catch (error) {
      console.error("Falha ao salvar atendimento", error);
    }
  }

  async function handleSaveProfile(updatedProfile: PatientProfile) {
    setPatientProfile(updatedProfile);

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.patientId === patientId
          ? { ...appointment, patientName: updatedProfile.name }
          : appointment,
      ),
    );

    try {
      const saved = await savePatientProfile(updatedProfile);
      setPatientProfile(saved);
      if (onPatientNameChange) {
        onPatientNameChange(saved.name);
      }
    } catch (error) {
      console.error("Falha ao salvar cadastro da paciente", error);
    }
  }

  const completedCount = useMemo(
    () => patientAppointments.filter((a) => a.status === "concluido").length,
    [patientAppointments],
  );
  const scheduledCount = useMemo(
    () =>
      patientAppointments.filter(
        (a) => a.status === "agendado" || a.status === "em_andamento",
      ).length,
    [patientAppointments],
  );
  const nextAppointment = useMemo(() => {
    const upcoming = patientAppointments
      .filter((a) => a.status === "agendado" || a.status === "em_andamento")
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0];
  }, [patientAppointments]);

  const unreadCount = patientNotifications.filter((n) => !n.read).length;

  function handleMarkAsRead(id: string) {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function handleMarkAllAsRead() {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <DashboardCard
          icon={<FileText className="h-5 w-5 text-pink-600" />}
          title="Cadastro"
        >
          <div className="flex h-full flex-col justify-end">
            <p className="mb-5 max-w-[260px] text-sm leading-relaxed text-[var(--muted-foreground)]">
              Atualize suas informações pessoais e histórico médico
            </p>
            <Button
              className="h-11 w-full rounded-full bg-[var(--primary)] font-semibold text-white hover:bg-[var(--primary)]/90"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Atualizar Dados
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard
          icon={<Calendar className="h-5 w-5 text-pink-600" />}
          title="Atendimentos"
        >
          <div className="flex h-full flex-col justify-end gap-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Próximo:</span>
              {nextAppointment ? (
                <Badge
                  variant="outline"
                  className="border-pink-200 bg-pink-50 text-pink-700"
                >
                  {formatDateBR(nextAppointment.date)}
                  {nextAppointment.time ? `, ${nextAppointment.time}` : ""}
                </Badge>
              ) : (
                <span className="text-[var(--muted-foreground)]">Sem data</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>Total:</span>
              <span>{scheduledCount} agendados</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted-foreground)]">
              <span>Concluídos:</span>
              <span>{completedCount}</span>
            </div>
            <Button
              className="mt-3 h-11 rounded-full bg-[var(--primary)] font-semibold text-white hover:bg-[var(--primary)]/90"
              onClick={() => setIsRequestModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Solicitar Atendimento
            </Button>
          </div>
        </DashboardCard>

        <DashboardCard
          icon={
            <div className="relative">
              <Bell className="h-5 w-5 text-pink-600" />
              {unreadCount > 0 && (
                <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[11px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          }
          title="Notificações"
        >
          <div className="flex h-full flex-col justify-end">
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              Você tem {unreadCount}{" "}
              {unreadCount === 1
                ? "notificação não lida"
                : "notificações não lidas"}
            </p>
          </div>
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <PatientAppointmentsTimeline appointments={patientAppointments} />
        <PatientNotifications
          notifications={patientNotifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
        />
      </div>
      <PatientProfileModal
        open={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={patientProfile}
        onSave={handleSaveProfile}
      />
      <PatientRequestAppointmentModal
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSave={handleSaveAppointment}
        patientName={patientName}
        patientId={patientId}
      />
    </div>
  );
}

interface PatientRequestAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  patientName: string;
  patientId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PatientRequestAppointmentModal({
  open,
  onClose,
  onSave,
  patientName,
  patientId,
}: PatientRequestAppointmentModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [consultationType, setConsultationType] = useState(
    "Acolhimento inicial",
  );
  const [professionalName, setProfessionalName] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setDate("");
    setTime("");
    setConsultationType("Acolhimento inicial");
    setProfessionalName("");
    setNotes("");
    setFiles([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    if (submitting) return;
    resetForm();
    onClose();
  }

  function handleAddFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(event.target.files ?? []);
    if (newFiles.length === 0) return;

    const allowedExt = ["pdf", "jpg", "jpeg"];
    const allowedMime = ["application/pdf", "image/jpeg", "image/jpg"];
    const invalid = newFiles.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const mimeOk = allowedMime.includes(file.type.toLowerCase());
      const extOk = allowedExt.includes(ext);
      return !mimeOk && !extOk;
    });

    if (invalid.length > 0) {
      setError(
        `Formato inválido em ${invalid
          .map((f) => f.name)
          .join(", ")}. Envie apenas PDF ou JPG.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    setFiles((current) => [...current, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date || !time) return;

    setSubmitting(true);
    setError(null);
    try {
      const attachments = await uploadAttachments(files);
      const now = new Date().toISOString();
      onSave({
        id: buildAppointmentId(),
        patientId: patientId,
        patientName: patientName,
        date,
        time,
        volunteerName: "Atendimento solicitado pela paciente",
        professionalName: professionalName.trim() || undefined,
        status: "agendado",
        observacoes: `Solicitação de atendimento: ${consultationType}${
          notes ? ` — ${notes}` : ""
        }`,
        encaminhamento: null,
        attachments: attachments.length > 0 ? attachments : undefined,
        createdBy: "paciente",
        createdAt: now,
        updatedAt: now,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Solicitar atendimento"
      description="Insira os dados para solicitar um novo atendimento."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Nome do paciente
          </label>
          <Input
            type="text"
            value={patientName}
            disabled
            className="bg-[#F8F1F5] text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Data
            </label>
            <DatePicker
              value={date}
              onChange={setDate}
              fromYear={new Date().getFullYear() - 2}
              toYear={new Date().getFullYear() + 2}
              required
              className="text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              Horário
            </label>
            <TimePicker
              value={time}
              onChange={setTime}
              required
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Tipo de consulta
          </label>
          <Select value={consultationType} onValueChange={setConsultationType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Acolhimento inicial">
                Acolhimento inicial
              </SelectItem>
              <SelectItem value="Consulta de acompanhamento">
                Consulta de acompanhamento
              </SelectItem>
              <SelectItem value="Sessão de fisioterapia">
                Sessão de fisioterapia
              </SelectItem>
              <SelectItem value="Sessão de psicologia">
                Sessão de psicologia
              </SelectItem>
              <SelectItem value="Consulta de retorno">
                Consulta de retorno
              </SelectItem>
              <SelectItem value="Outra">Outra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Nome do profissional ou clínica
          </label>
          <Input
            type="text"
            value={professionalName}
            onChange={(event) => setProfessionalName(event.target.value)}
            placeholder="Ex.: Dra. Joana Mello — Clínica Saúde Mais"
            className="text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Observações
          </label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Descreva alguma informação adicional..."
            className="text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            Anexos (diagnósticos, receitas, exames)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
            onChange={handleAddFiles}
            className="block w-full text-sm text-[var(--muted-foreground)] file:mr-3 file:rounded-full file:border-0 file:bg-pink-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-pink-700 hover:file:bg-pink-200"
          />
          {files.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-pink-100 bg-pink-50/40 px-3 py-2 text-sm"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 truncate">
                    <Paperclip size={14} className="shrink-0 text-pink-600" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                      {formatFileSize(file.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="rounded-full p-1 text-red-600 hover:bg-red-50"
                    aria-label={`Remover ${file.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Apenas PDF ou JPG. Até 10 arquivos, 10 MB cada.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Solicitar atendimento"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

interface PatientProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: PatientProfile | null;
  onSave: (profile: PatientProfile) => void;
}

function emptyForm(): {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  city: string;
  district: string;
  familyHistory: "" | "sim" | "nao" | "nao_sei";
  symptoms: string;
} {
  return {
    name: "",
    email: "",
    phone: "",
    cpf: "",
    birthDate: "",
    city: "",
    district: "",
    familyHistory: "",
    symptoms: "",
  };
}

function PatientProfileModal({
  open,
  onClose,
  profile,
  onSave,
}: PatientProfileModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (profile) {
      setForm({
        name: profile.name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ? formatPhoneBR(profile.phone) : "",
        cpf: profile.cpf ? formatCpf(profile.cpf) : "",
        birthDate: normalizeProfileDate(profile.birthDate ?? ""),
        city: profile.city ?? "",
        district: profile.district ?? "",
        familyHistory: profile.familyHistory ?? "",
        symptoms: profile.symptoms ?? "",
      });
    } else {
      setForm(emptyForm());
    }
    setErrors({});
  }, [open, profile]);

  const cpfReadonly = Boolean(profile?.cpf);

  function setField<K extends keyof ReturnType<typeof emptyForm>>(
    field: K,
    value: ReturnType<typeof emptyForm>[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Informe o nome completo.";
    if (!form.email.trim()) {
      next.email = "Informe o e-mail.";
    } else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      next.email = "Informe um e-mail válido.";
    }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      next.phone = "Informe o telefone.";
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      next.phone = "Telefone deve ter 10 ou 11 dígitos.";
    }
    if (!cpfReadonly) {
      const cpfDigits = form.cpf.replace(/\D/g, "");
      if (cpfDigits && cpfDigits.length !== 11) {
        next.cpf = "CPF deve conter 11 dígitos.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleClose() {
    if (submitting) return;
    onClose();
    setErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      onSave({
        ...profile,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\D/g, ""),
        birthDate: form.birthDate || undefined,
        city: form.city.trim() || undefined,
        district: form.district.trim() || undefined,
        familyHistory: form.familyHistory || undefined,
        symptoms: form.symptoms.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Atualizar dados"
      description="Atualize suas informações pessoais e histórico médico"
      className="max-w-2xl"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Informações Pessoais */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-600" />
            <h3 className="font-semibold text-[var(--foreground)]">
              Informações Pessoais
            </h3>
          </div>

          <div className="space-y-4">
            <Field label="Nome completo *" error={errors.name}>
              <Input
                type="text"
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="Seu nome completo"
                className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={cpfReadonly ? "CPF (não editável)" : "CPF"}
                error={errors.cpf}
              >
                <Input
                  type="text"
                  value={form.cpf}
                  readOnly={cpfReadonly}
                  onChange={(event) =>
                    cpfReadonly
                      ? undefined
                      : setField("cpf", formatCpf(event.target.value))
                  }
                  placeholder="000.000.000-00"
                  className={`rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm ${
                    cpfReadonly ? "cursor-not-allowed opacity-70" : ""
                  }`}
                />
              </Field>
              <Field label="Data de nascimento">
                <DatePicker
                  value={form.birthDate}
                  onChange={(value) => setField("birthDate", value)}
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                  className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail *" error={errors.email}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm"
                />
              </Field>
              <Field label="Telefone/WhatsApp *" error={errors.phone}>
                <Input
                  type="tel"
                  inputMode="tel"
                  maxLength={15}
                  value={form.phone}
                  onChange={(event) =>
                    setField("phone", formatPhoneBR(event.target.value))
                  }
                  placeholder="(47) 99999-9999"
                  className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm"
                />
              </Field>
            </div>
          </div>
        </section>

        {/* Localização */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-pink-600" />
            <h3 className="font-semibold text-[var(--foreground)]">
              Localização
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cidade">
              <Input
                type="text"
                value={form.city}
                onChange={(event) => setField("city", event.target.value)}
                placeholder="Sua cidade"
                className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm"
              />
            </Field>
            <Field label="Bairro">
              <Input
                type="text"
                value={form.district}
                onChange={(event) => setField("district", event.target.value)}
                placeholder="Seu bairro"
                className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm"
              />
            </Field>
          </div>
        </section>

        {/* Informações de Saúde */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-pink-600" />
            <h3 className="font-semibold text-[var(--foreground)]">
              Informações de Saúde
            </h3>
          </div>

          <div className="space-y-4">
            <Field label="Histórico familiar de câncer">
              <Select
                value={form.familyHistory || "none"}
                onValueChange={(value) =>
                  setField(
                    "familyHistory",
                    value === "none"
                      ? ""
                      : (value as "sim" | "nao" | "nao_sei"),
                  )
                }
              >
                <SelectTrigger className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Prefiro não informar</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="nao_sei">Não sei</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Sintomas ou observações">
              <Textarea
                value={form.symptoms}
                onChange={(event) => setField("symptoms", event.target.value)}
                rows={3}
                placeholder="Descreva sintomas, alergias, condições médicas ou observações relevantes."
                className="rounded-2xl border-pink-200 bg-[var(--input-background)] text-sm"
              />
            </Field>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-pink-100 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DashboardCard({ icon, title, children }: DashboardCardProps) {
  return (
    <section className="flex min-h-[274px] flex-col rounded-2xl border border-pink-100 bg-white p-7 shadow-sm shadow-pink-100/50">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h2 className="text-xl font-medium text-[var(--foreground)]">
          {title}
        </h2>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-100">
          {icon}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
