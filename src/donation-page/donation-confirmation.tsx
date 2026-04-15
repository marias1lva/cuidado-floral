import { Heart } from "lucide-react";

interface DonationConfirmationProps {
  onClose: () => void;
}

export function DonationConfirmation({ onClose }: DonationConfirmationProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-100">
        <Heart className="h-10 w-10 text-pink-500 fill-pink-400" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold text-[var(--primary)]">
          Obrigado pela sua doação! ❤️
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] max-w-xs mx-auto leading-relaxed">
          Entraremos em contato em breve para confirmar os detalhes.
          Sua generosidade faz toda a diferença.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-pink-100 bg-pink-50/60 p-4">
        <p className="text-xs text-pink-700 leading-relaxed">
          🌸 Cada doação contribui diretamente para o apoio a mulheres em tratamento do
          câncer de mama na região de Itapema.
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-pink-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-pink-600"
      >
        Voltar à área inicial
      </button>
    </div>
  );
}
