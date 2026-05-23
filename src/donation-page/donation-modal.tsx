import { useState } from "react";
import { X } from "lucide-react";
import type {
  DonationType,
  DonationStep,
  FinancialDonationForm,
  MaterialDonationForm,
} from "./donation-types";
import { DonationChoice } from "./donation-choice";
import { FinancialDonation } from "./donation-financial";
import { MaterialDonation } from "./donation-material";
import { DonationConfirmation } from "./donation-confirmation";
import { buildDonationId, buildDonationProtocol } from "../domain/donor-data";
import { DEMO_DONOR_ID, DEMO_DONOR_NAME } from "../domain/storage";
import type { Donation } from "../domain/types";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (donation: Donation) => void;
}

function parseAmount(input: string): number | undefined {
  if (!input) {
    return undefined;
  }
  const normalized = input.replace(/[^\d,.-]/g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : undefined;
}

export function DonationModal({ isOpen, onClose, onCreate }: DonationModalProps) {
  const [step, setStep] = useState<DonationStep>("escolha");
  const [donationType, setDonationType] = useState<DonationType>(null);

  function handleClose() {
    setStep("escolha");
    setDonationType(null);
    onClose();
  }

  function handleContinue() {
    if (donationType === "financeira") setStep("financeira");
    else if (donationType === "material") setStep("material");
  }

  function handleFinancialConfirm(form: FinancialDonationForm) {
    const now = new Date().toISOString();
    const donation: Donation = {
      id: buildDonationId(),
      donorId: DEMO_DONOR_ID,
      donorName: form.nome.trim() || DEMO_DONOR_NAME,
      donorPhone: form.telefone.trim() || undefined,
      kind: "financeira",
      date: now,
      status: "pendente",
      amount: parseAmount(form.valorEstimado),
      protocol: buildDonationProtocol(),
      receiptIssuedAt: now,
    };
    onCreate?.(donation);
    setStep("confirmacao");
  }

  function handleMaterialConfirm(form: MaterialDonationForm) {
    const donation: Donation = {
      id: buildDonationId(),
      donorId: DEMO_DONOR_ID,
      donorName: form.nome.trim() || DEMO_DONOR_NAME,
      donorPhone: form.telefone.trim() || undefined,
      kind: "material",
      date: new Date().toISOString(),
      status: "pendente",
      itemType: form.tipoItem || undefined,
      quantity: form.quantidade.trim() || undefined,
      description: form.descricao.trim() || undefined,
      deliveryMethod: form.formaEntrega || undefined,
      notes: form.observacoes.trim() || undefined,
    };
    onCreate?.(donation);
    setStep("confirmacao");
  }

  function handleBack() {
    setStep("escolha");
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "confirmacao") handleClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl border border-pink-100 bg-white p-6 shadow-xl shadow-pink-100/40 max-h-[90vh] overflow-y-auto">
        {step !== "confirmacao" && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}

        {step !== "confirmacao" && (
          <div className="mb-5 flex items-center gap-1.5">
            {(["escolha", "financeira", "confirmacao"] as const).map((s, i) => {
              const stepsOrder: DonationStep[] =
                donationType === "material"
                  ? ["escolha", "material", "confirmacao"]
                  : ["escolha", "financeira", "confirmacao"];
              const currentIndex = stepsOrder.indexOf(step);
              const isActive = i <= currentIndex;
              return (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    isActive ? "bg-pink-500" : "bg-gray-100"
                  }`}
                />
              );
            })}
          </div>
        )}

        {step === "escolha" && (
          <DonationChoice
            selected={donationType}
            onSelect={setDonationType}
            onContinue={handleContinue}
            onCancel={handleClose}
          />
        )}

        {step === "financeira" && (
          <FinancialDonation onBack={handleBack} onConfirm={handleFinancialConfirm} />
        )}

        {step === "material" && (
          <MaterialDonation onBack={handleBack} onConfirm={handleMaterialConfirm} />
        )}

        {step === "confirmacao" && <DonationConfirmation onClose={handleClose} />}
      </div>
    </div>
  );
}
