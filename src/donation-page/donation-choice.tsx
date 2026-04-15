import { Heart, Package } from "lucide-react";
import type { DonationType } from "./donation-types";

interface DonationChoiceProps {
  selected: DonationType;
  onSelect: (type: DonationType) => void;
  onContinue: () => void;
  onCancel: () => void;
}

export function DonationChoice({
  selected,
  onSelect,
  onContinue,
  onCancel,
}: DonationChoiceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--primary)]">Quero doar</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Escolha como deseja apoiar a Rede Feminina.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("financeira")}
          className={`group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
            selected === "financeira"
              ? "border-pink-500 bg-pink-50 shadow-sm"
              : "border-gray-100 bg-white hover:border-pink-200 hover:bg-pink-50/40"
          }`}
        >
          <div
            className={`rounded-xl p-2.5 transition-colors ${
              selected === "financeira" ? "bg-pink-500" : "bg-pink-100 group-hover:bg-pink-200"
            }`}
          >
            <Heart
              className={`h-5 w-5 ${selected === "financeira" ? "text-white" : "text-pink-500"}`}
            />
          </div>
          <div>
            <p
              className={`font-semibold ${
                selected === "financeira" ? "text-pink-700" : "text-gray-800"
              }`}
            >
              Doação Financeira
            </p>
            <p className="mt-0.5 text-xs text-gray-500">PIX ou contato direto com a ONG</p>
          </div>
          {selected === "financeira" && (
            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white text-xs">
              ✓
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelect("material")}
          className={`group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
            selected === "material"
              ? "border-pink-500 bg-pink-50 shadow-sm"
              : "border-gray-100 bg-white hover:border-pink-200 hover:bg-pink-50/40"
          }`}
        >
          <div
            className={`rounded-xl p-2.5 transition-colors ${
              selected === "material" ? "bg-pink-500" : "bg-pink-100 group-hover:bg-pink-200"
            }`}
          >
            <Package
              className={`h-5 w-5 ${selected === "material" ? "text-white" : "text-pink-500"}`}
            />
          </div>
          <div>
            <p
              className={`font-semibold ${
                selected === "material" ? "text-pink-700" : "text-gray-800"
              }`}
            >
              Doação de Material
            </p>
            <p className="mt-0.5 text-xs text-gray-500">Roupas, cabelo, alimentos e mais</p>
          </div>
          {selected === "material" && (
            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white text-xs">
              ✓
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selected}
          className="flex-1 rounded-xl bg-pink-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
