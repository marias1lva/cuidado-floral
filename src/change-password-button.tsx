import { useState } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { changePassword } from "./domain/auth";

type Variant = "navbar-light" | "navbar-dark";

interface ChangePasswordButtonProps {
  variant?: Variant;
}

export function ChangePasswordButton({
  variant = "navbar-light",
}: ChangePasswordButtonProps) {
  const [open, setOpen] = useState(false);

  const baseClass =
    "flex items-center gap-1 text-sm bg-transparent border-0 cursor-pointer transition-opacity hover:opacity-75";
  const colorClass =
    variant === "navbar-dark"
      ? "text-[var(--muted-foreground)]"
      : "text-[var(--primary)]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${baseClass} ${colorClass}`}
        aria-label="Trocar minha senha"
      >
        <KeyRound size={15} />
        Senha
      </button>
      <ChangePasswordModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }
    if (newPassword.length < 6) {
      setError("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("A nova senha deve ser diferente da atual.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível trocar a senha.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Trocar senha"
      description="Confirme sua senha atual e escolha uma nova."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Senha atual">
          <Input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
          />
        </Field>
        <Field label="Nova senha">
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
          />
        </Field>
        <Field label="Confirmar nova senha">
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            className="rounded-2xl border-pink-200 bg-[var(--input-background)]"
          />
        </Field>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Senha atualizada com sucesso.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-pink-100 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-full border-pink-200"
          >
            Fechar
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Trocar senha"}
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
      <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}
