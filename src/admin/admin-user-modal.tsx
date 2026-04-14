import { useEffect, useState } from "react";

import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { ManagedUser, ManagedUserRole } from "./types";

interface AdminUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (user: {
    name: string;
    email: string;
    cpf: string;
    type: ManagedUserRole;
  }) => void;
  existingUsers: ManagedUser[];
  editingUser?: ManagedUser | null;
}

interface UserFormState {
  name: string;
  email: string;
  cpf: string;
  type: ManagedUserRole;
}

const initialFormState: UserFormState = {
  name: "",
  email: "",
  cpf: "",
  type: "paciente",
};

function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const cpfDigits = normalizeCpf(value).slice(0, 11);
  return cpfDigits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatRoleLabel(role: ManagedUserRole) {
  if (role === "voluntaria") {
    return "Voluntária";
  }
  if (role === "paciente") {
    return "Paciente";
  }
  if (role === "doador") {
    return "Doador";
  }
  return "Administrador";
}

export function AdminUserModal({
  open,
  onClose,
  onSubmit,
  existingUsers,
  editingUser,
}: AdminUserModalProps) {
  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [errors, setErrors] = useState<
    Partial<Record<keyof UserFormState, string>>
  >({});

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!editingUser) {
      setForm(initialFormState);
      setErrors({});
      return;
    }

    setForm({
      name: editingUser.name,
      email: editingUser.email,
      cpf: editingUser.cpf,
      type: editingUser.type,
    });
    setErrors({});
  }, [open, editingUser]);

  function handleClose() {
    setForm(initialFormState);
    setErrors({});
    onClose();
  }

  function setField<K extends keyof UserFormState>(
    field: K,
    value: UserFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof UserFormState, string>> = {};
    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedCpf = normalizeCpf(form.cpf);

    if (!form.name.trim()) {
      nextErrors.name = "Informe o nome do usuário.";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Informe o e-mail.";
    } else if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      nextErrors.email = "Informe um e-mail válido.";
    }

    if (!normalizedCpf) {
      nextErrors.cpf = "Informe o CPF.";
    } else if (normalizedCpf.length !== 11) {
      nextErrors.cpf = "CPF deve conter 11 dígitos.";
    }

    const duplicatedByEmail = existingUsers.find(
      (user) =>
        user.email.trim().toLowerCase() === normalizedEmail &&
        user.id !== editingUser?.id,
    );
    if (duplicatedByEmail) {
      nextErrors.email = "Já existe um usuário com este e-mail.";
    }

    const duplicatedByCpf = existingUsers.find(
      (user) =>
        normalizeCpf(user.cpf) === normalizedCpf && user.id !== editingUser?.id,
    );
    if (duplicatedByCpf) {
      nextErrors.cpf = "Já existe um usuário com este CPF.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      cpf: formatCpf(form.cpf),
      type: form.type,
    });
    handleClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={editingUser ? "Editar usuário" : "Novo Usuário"}
      description="Preencha os dados obrigatórios para salvar o cadastro."
      className="max-w-xl"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <FormField label="Nome" error={errors.name}>
          <Input
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="Nome completo"
            aria-invalid={Boolean(errors.name)}
            className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
          />
        </FormField>

        <FormField label="E-mail" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            placeholder="usuario@email.com"
            aria-invalid={Boolean(errors.email)}
            className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="CPF" error={errors.cpf}>
            <Input
              value={form.cpf}
              onChange={(event) =>
                setField("cpf", formatCpf(event.target.value))
              }
              placeholder="000.000.000-00"
              aria-invalid={Boolean(errors.cpf)}
              className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
            />
          </FormField>

          <FormField label="Tipo de acesso">
            <Select
              value={form.type}
              onValueChange={(value) =>
                setField("type", value as ManagedUserRole)
              }
            >
              <SelectTrigger className="w-full rounded-2xl border-pink-200 bg-[var(--input-background)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="start"
                sideOffset={6}
                className="z-[1000] rounded-2xl border-pink-200 bg-white shadow-lg"
              >
                {(
                  [
                    "admin",
                    "voluntaria",
                    "paciente",
                    "doador",
                  ] as ManagedUserRole[]
                ).map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-pink-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="rounded-full border-pink-200"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            {editingUser ? "Salvar alterações" : "Salvar usuário"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

function FormField({ label, children, error }: FormFieldProps) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
