import { useState } from "react";
import { Copy, Check, MessageCircle, ChevronLeft } from "lucide-react";
import type { FinancialDonationForm } from "./donation-types";

// ⚠️  Substitua pelos dados reais da ONG antes de entregar
const PIX_KEY = "ong@redefeminina.org.br";
const WHATSAPP_NUMBER = "5547999999999"; // DDI + DDD + número
const WHATSAPP_MESSAGE = "Quero%20fazer%20uma%20doa%C3%A7%C3%A3o";

interface FinancialDonationProps {
  onBack: () => void;
  onConfirm: () => void;
}

export function FinancialDonation({ onBack, onConfirm }: FinancialDonationProps) {
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<FinancialDonationForm>({
    nome: "",
    telefone: "",
    valorEstimado: "",
  });
  const [errors, setErrors] = useState<Partial<FinancialDonationForm>>({});

  function handleChange(field: keyof FinancialDonationForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleCopyPix() {
    navigator.clipboard.writeText(PIX_KEY).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function validate(): boolean {
    const newErrors: Partial<FinancialDonationForm> = {};
    if (!form.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!form.telefone.trim()) newErrors.telefone = "Telefone é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (validate()) onConfirm();
  }

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

  return (
    <div className="space-y-6">
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
        <h2 className="text-xl font-semibold text-[var(--primary)]">Doação Financeira</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Ajude a ONG via PIX ou entre em contato pelo WhatsApp.
        </p>
      </div>

      {/* PIX Box */}
      <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-5 space-y-4">
        {/* QR Code placeholder — substitua pela imagem real do QR Code da ONG */}
        <div className="flex justify-center">
          <div className="flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-pink-300 bg-white text-center">
            <p className="text-xs text-pink-400 px-2 leading-relaxed">
              QR Code PIX<br />
              <span className="text-gray-400">(inserir imagem)</span>
            </p>
          </div>
        </div>

        {/* Chave PIX */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Chave PIX</p>
          <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-3.5 py-2.5">
            <span className="flex-1 text-sm font-mono text-gray-700 truncate">{PIX_KEY}</span>
            <button
              type="button"
              onClick={handleCopyPix}
              className="flex items-center gap-1.5 rounded-lg bg-pink-100 px-2.5 py-1.5 text-xs font-medium text-pink-700 transition-colors hover:bg-pink-200"
            >
              {copied ? (
                <>
                  <Check size={13} />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy size={13} />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* WhatsApp */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600"
        >
          <MessageCircle size={16} />
          Falar no WhatsApp
        </a>
      </div>

      {/* Mini formulário */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Seus dados (para confirmarmos a doação)</p>

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
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Valor estimado <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.valorEstimado}
            onChange={(e) => handleChange("valorEstimado", e.target.value)}
            placeholder="R$ 0,00"
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-xl bg-pink-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-pink-600"
      >
        Confirmar doação
      </button>
    </div>
  );
}
