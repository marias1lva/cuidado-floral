import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { MaterialDonationForm, DeliveryMethod, ItemType } from "./donation-types";

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: "roupas", label: "Roupas" },
  { value: "cabelo", label: "Cabelo" },
  { value: "alimentos", label: "Alimentos" },
  { value: "higiene", label: "Higiene pessoal" },
  { value: "medicamentos", label: "Medicamentos" },
  { value: "outros", label: "Outros" },
];

interface MaterialDonationProps {
  onBack: () => void;
  onConfirm: () => void;
}

export function MaterialDonation({ onBack, onConfirm }: MaterialDonationProps) {
  const [form, setForm] = useState<MaterialDonationForm>({
    nome: "",
    telefone: "",
    tipoItem: "",
    quantidade: "",
    descricao: "",
    formaEntrega: "",
    observacoes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MaterialDonationForm, string>>>({});

  function handleChange(field: keyof MaterialDonationForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const required: (keyof MaterialDonationForm)[] = [
      "nome",
      "telefone",
      "tipoItem",
      "quantidade",
      "descricao",
      "formaEntrega",
    ];
    const newErrors: Partial<Record<keyof MaterialDonationForm, string>> = {};
    required.forEach((field) => {
      if (!form[field].trim()) newErrors[field] = "Campo obrigatório";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (validate()) onConfirm();
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600 transition-colors"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[var(--primary)]">Doação de Material</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Preencha os dados da sua doação e entraremos em contato.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nome *</label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            placeholder="Seu nome completo"
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 focus:ring-2 focus:ring-pink-100 ${
              errors.nome ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
            }`}
          />
          {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Telefone *</label>
          <input
            type="tel"
            value={form.telefone}
            onChange={(e) => handleChange("telefone", e.target.value)}
            placeholder="(47) 99999-9999"
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 focus:ring-2 focus:ring-pink-100 ${
              errors.telefone ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
            }`}
          />
          {errors.telefone && <p className="mt-1 text-xs text-red-500">{errors.telefone}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Tipo de item *</label>
          <select
            value={form.tipoItem}
            onChange={(e) => handleChange("tipoItem", e.target.value)}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 focus:ring-2 focus:ring-pink-100 bg-white ${
              errors.tipoItem ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}
          >
            <option value="">Selecione...</option>
            {ITEM_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {errors.tipoItem && <p className="mt-1 text-xs text-red-500">{errors.tipoItem}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Quantidade *</label>
          <input
            type="text"
            value={form.quantidade}
            onChange={(e) => handleChange("quantidade", e.target.value)}
            placeholder="Ex: 3 peças, 1 kg..."
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 focus:ring-2 focus:ring-pink-100 ${
              errors.quantidade ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
            }`}
          />
          {errors.quantidade && <p className="mt-1 text-xs text-red-500">{errors.quantidade}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Descrição *</label>
          <textarea
            value={form.descricao}
            onChange={(e) => handleChange("descricao", e.target.value)}
            placeholder="Descreva brevemente os itens a serem doados..."
            rows={3}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none ${
              errors.descricao ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
            }`}
          />
          {errors.descricao && <p className="mt-1 text-xs text-red-500">{errors.descricao}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Forma de entrega *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "levar" as DeliveryMethod, label: "Vou levar" },
                { value: "retirada" as DeliveryMethod, label: "Retirada" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange("formaEntrega", option.value)}
                className={`rounded-xl border-2 py-2.5 text-sm font-medium transition-all ${
                  form.formaEntrega === option.value
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-pink-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.formaEntrega && (
            <p className="mt-1 text-xs text-red-500">{errors.formaEntrega}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Observações <span className="text-gray-400">(opcional)</span>
          </label>
          <textarea
            value={form.observacoes}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder="Informações adicionais..."
            rows={2}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-xl bg-pink-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-pink-600"
      >
        Enviar doação
      </button>
    </div>
  );
}
