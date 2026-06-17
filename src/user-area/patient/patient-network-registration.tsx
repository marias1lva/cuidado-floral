import { useState, useRef, useEffect } from "react";
import { Heart, Loader2, AlertCircle, CheckCircle, MapPin, Phone, Mail, Users, FileText } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Dialog } from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";

interface PatientNetworkRegistrationProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RegistrationForm {
  fullName: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  referralType: "autoencaminhamento" | "profissional" | "amiga";
  referralDetails: string;
  symptoms: string;
  medicalHistory: string;
  currentTreatment: string;
  agreement: boolean;
}

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11 || /^(\d)\1{10}$/.test(numbers)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.substring(10, 11))) return false;
  
  return true;
}

export function PatientNetworkRegistration({
  open,
  onClose,
  onSuccess,
}: PatientNetworkRegistrationProps) {
  const [form, setForm] = useState<RegistrationForm>({
    fullName: "",
    cpf: "",
    birthDate: "",
    email: "",
    phone: "",
    city: "",
    neighborhood: "",
    referralType: "autoencaminhamento",
    referralDetails: "",
    symptoms: "",
    medicalHistory: "",
    currentTreatment: "",
    agreement: false,
  });

  const [state, setState] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) {
      setForm({
        fullName: "",
        cpf: "",
        birthDate: "",
        email: "",
        phone: "",
        city: "",
        neighborhood: "",
        referralType: "autoencaminhamento",
        referralDetails: "",
        symptoms: "",
        medicalHistory: "",
        currentTreatment: "",
        agreement: false,
      });
      setState("");
      setErrors({});
      setSuccessMessage(false);
    }
  }, [open]);

  function handleInputChange(
    field: keyof RegistrationForm,
    value: string | boolean
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  function handlePhoneChange(value: string) {
    const numbers = value.replace(/\D/g, "");
    let formatted = numbers;
    if (numbers.length > 0) {
      formatted = `(${numbers.slice(0, 2)}`;
    }
    if (numbers.length > 2) {
      formatted += ` ${numbers.slice(2, 7)}`;
    }
    if (numbers.length > 7) {
      formatted += `-${numbers.slice(7, 11)}`;
    }
    formatted += numbers.length > 11 ? "" : ")";
    handleInputChange("phone", formatted);
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Nome completo é obrigatório";
    }
    if (!form.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(form.cpf)) {
      newErrors.cpf = "CPF inválido. Digite apenas números no formato 000.000.000-00.";
    }
    if (!form.birthDate) {
      newErrors.birthDate = "Data de nascimento é obrigatória";
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email válido é obrigatório";
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Telefone é obrigatório";
    }
    if (!state) {
      newErrors.state = "Estado é obrigatório";
    }
    if (!form.city.trim()) {
      newErrors.city = "Cidade é obrigatória";
    }
    if (!form.neighborhood.trim()) {
      newErrors.neighborhood = "Bairro é obrigatório";
    }
    if (!form.symptoms.trim()) {
      newErrors.symptoms = "Descreva seus sintomas ou motivo da solicitação";
    }
    if (!form.agreement) {
      newErrors.agreement = "Você deve aceitar os termos para continuar";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const registrationData = {
        id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...form,
        state,
        status: "pendente",
        createdAt: new Date().toISOString(),
      };

      // Salvar no localStorage por enquanto
      const existingRegistrations = JSON.parse(
        localStorage.getItem("pendingPatientRegistrations") || "[]"
      );
      localStorage.setItem(
        "pendingPatientRegistrations",
        JSON.stringify([...existingRegistrations, registrationData])
      );

      setSuccessMessage(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "Erro ao enviar registro",
      });
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
      onClose={onClose}
      title="Cadastro na Rede Feminina"
      description="Preencha suas informações para solicitar cadastro e análise"
    >
      {successMessage ? (
        <div className="space-y-4 py-8 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
              Cadastro enviado com sucesso!
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Suas informações foram recebidas e serão analisadas por nossa equipe.
              Em breve você receberá um retorno.
            </p>
          </div>
        </div>
      ) : (
        <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
          {/* Informações Pessoais */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-pink-600" />
              <h3 className="font-semibold text-[var(--foreground)]">
                Informações Pessoais
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Nome completo *
                </label>
                <Input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Seu nome completo"
                  className="text-sm"
                  disabled={submitting}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    CPF *
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}"
                    value={form.cpf}
                    onChange={(e) => handleInputChange("cpf", formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="text-sm"
                    autoComplete="off"
                    disabled={submitting}
                  />
                  {errors.cpf && (
                    <p className="mt-1 text-xs text-red-600">{errors.cpf}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Data de nascimento *
                  </label>
                  <Input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    className="text-sm"
                    disabled={submitting}
                  />
                  {errors.birthDate && (
                    <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="text-sm"
                    disabled={submitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Telefone/WhatsApp *
                  </label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength="15"
                    className="text-sm"
                    disabled={submitting}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Localização */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-pink-600" />
              <h3 className="font-semibold text-[var(--foreground)]">Localização</h3>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Estado *
                  </label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger disabled={submitting}>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Cidade *
                  </label>
                  <Input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Sua cidade"
                    className="text-sm"
                    disabled={submitting}
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Bairro *
                </label>
                <Input
                  type="text"
                  value={form.neighborhood}
                  onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                  placeholder="Seu bairro"
                  className="text-sm"
                  disabled={submitting}
                />
                {errors.neighborhood && (
                  <p className="mt-1 text-xs text-red-600">{errors.neighborhood}</p>
                )}
              </div>
            </div>
          </section>

          {/* Encaminhamento */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              <h3 className="font-semibold text-[var(--foreground)]">
                Como nos conheceu?
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Tipo de encaminhamento *
                </label>
                <Select
                  value={form.referralType}
                  onValueChange={(value) =>
                    handleInputChange("referralType", value as RegistrationForm["referralType"])
                  }
                >
                  <SelectTrigger disabled={submitting}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autoencaminhamento">
                      Busca própria / Redes sociais
                    </SelectItem>
                    <SelectItem value="profissional">
                      Encaminhamento profissional (médico, psicólogo, etc)
                    </SelectItem>
                    <SelectItem value="amiga">
                      Indicação de amiga/conhecida
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Detalhes adicionais
                </label>
                <Input
                  type="text"
                  value={form.referralDetails}
                  onChange={(e) => handleInputChange("referralDetails", e.target.value)}
                  placeholder="Ex.: Nome do profissional, amiga, etc"
                  className="text-sm"
                  disabled={submitting}
                />
              </div>
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
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Descreva seus sintomas ou motivo da solicitação *
                </label>
                <Textarea
                  value={form.symptoms}
                  onChange={(e) => handleInputChange("symptoms", e.target.value)}
                  placeholder="Descreva brevemente seus sintomas ou o motivo da solicitação de cadastro..."
                  className="text-sm"
                  rows={3}
                  disabled={submitting}
                />
                {errors.symptoms && (
                  <p className="mt-1 text-xs text-red-600">{errors.symptoms}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Histórico médico relevante
                </label>
                <Textarea
                  value={form.medicalHistory}
                  onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                  placeholder="Condições médicas relevantes, alergias, cirurgias anteriores, etc"
                  className="text-sm"
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Tratamento atual
                </label>
                <Textarea
                  value={form.currentTreatment}
                  onChange={(e) => handleInputChange("currentTreatment", e.target.value)}
                  placeholder="Medicações, terapias ou acompanhamentos em andamento"
                  className="text-sm"
                  rows={2}
                  disabled={submitting}
                />
              </div>
            </div>
          </section>

          {/* Termos */}
          <section className="space-y-3 rounded-xl border border-pink-100 bg-pink-50/40 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreement"
                checked={form.agreement}
                onChange={(e) => handleInputChange("agreement", e.target.checked)}
                disabled={submitting}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-2 border-pink-300 accent-pink-600"
              />
              <label htmlFor="agreement" className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                Concordo que meus dados sejam analisados pela equipe da Rede Feminina
                e estou ciente de que serei contatada apenas por canais oficiais.
              </label>
            </div>
            {errors.agreement && (
              <p className="text-xs text-red-600">{errors.agreement}</p>
            )}
          </section>

          {errors.submit && (
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Solicitar Cadastro
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
