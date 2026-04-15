import { useState } from "react";
import { Heart, LogOut, User, Bell, Phone, Mail, MapPin } from "lucide-react";
import { DonationModal } from "../donation-page/donation-modal";
import { DonorDashboard } from "./donor/donor-dashboard";

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

const mockUser = {
  name: "João Doador",
};

export function UserArea({ role, onLogout }: UserAreaProps) {
  const content = roleContent[role];
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">

      <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl w-11 h-11"
            style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}
          >
            <Heart className="text-white" size={20} fill="white" />
          </div>
          <div>
            <p className="font-semibold text-[var(--primary)] text-sm leading-tight">
              Cuidado Floral
            </p>
            <p className="text-xs text-[var(--muted-foreground)] leading-tight">
              Rede Feminina de Combate ao Câncer - Itapema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer">
            <Bell size={20} className="text-[var(--muted-foreground)]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--primary)]" />
          </div>

          <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
            <User size={17} />
            <span>{mockUser.name}</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-sm text-[var(--primary)] bg-transparent border-0 cursor-pointer hover:opacity-75 transition-opacity"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-3xl border border-pink-100 bg-white p-8 shadow-sm shadow-pink-100/40">

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-pink-100 p-2">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <h1 className="text-2xl font-semibold text-[var(--primary)]">
                {content.title}
              </h1>
            </div>

            {role === "doador" && (
              <button
                onClick={() => setIsDonationModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600"
              >
                <Heart size={14} className="fill-white" />
                Realizar Doação
              </button>
            )}
          </div>

          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            {content.subtitle}
          </p>

          {role === "doador" && <DonorDashboard />}
        </div>
      </main>

            <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background)] pb-4 pt-10">
        <div className="mx-auto w-full max-w-[1200px] px-4">
          <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Heart size={16} className="text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary)]">
                  Sobre Nós
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                A Rede Feminina de Combate ao Câncer de Mama de Itapema trabalha
                para apoiar pacientes e promover a conscientização sobre o
                câncer de mama.
              </p>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Contato</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Phone size={14} className="text-[var(--primary)]" />
                  (47) 3368-XXXX
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <Mail size={14} className="text-[var(--primary)]" />
                  contato@cuidadofloral.org.br
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <MapPin size={14} className="text-[var(--primary)]" />
                  Itapema, SC
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Links Úteis</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Sobre o Câncer de Mama", highlight: false },
                  { label: "Como Ajudar", highlight: true },
                  { label: "Política de Privacidade", highlight: false },
                  { label: "Termos de Uso", highlight: false },
                ].map(({ label, highlight }) => (
                  <a
                    key={label}
                    href="#"
                    className={`text-sm no-underline transition-colors hover:text-[var(--primary)] ${
                      highlight
                        ? "text-[var(--primary)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 text-center text-xs text-[var(--muted-foreground)]">
            © 2025 Cuidado Floral - Rede Feminina de Combate ao Câncer de Mama.
            Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
      />
    </div>
  );
}