import { Heart, LogOut } from "lucide-react";

type UserAreaRole = "paciente" | "doador";

interface UserAreaProps {
  role: UserAreaRole;
  onLogout: () => void;
}

const roleContent: Record<UserAreaRole, { title: string; subtitle: string }> = {
  paciente: {
    title: "Área da Paciente",
    subtitle: "Acompanhe solicitações e informações do seu atendimento.",
  },
  doador: {
    title: "Área do Doador",
    subtitle: "Acompanhe campanhas e histórico de doações.",
  },
};

export function UserArea({ role, onLogout }: UserAreaProps) {
  const content = roleContent[role];

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-pink-100 bg-white p-8 shadow-sm shadow-pink-100/40">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-pink-100 p-2">
            <Heart className="h-5 w-5 text-pink-600" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--primary)]">{content.title}</h1>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">{content.subtitle}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-6 flex items-center gap-1 text-sm text-[var(--primary)] bg-transparent border-0 cursor-pointer hover:opacity-75 transition-opacity"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </main>
  );
}
