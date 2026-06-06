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
import { useBodyScrollLock } from "../ui/use-body-scroll-lock";
import { parseCurrencyInput } from "../ui/currency-input";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (donation: Donation) => void;
}

function parseAmount(input: string): number | undefined {
  return parseCurrencyInput(input);
}

export function DonationModal({
  isOpen,
  onClose,
  onCreate,
}: DonationModalProps) {
  const [step, setStep] = useState<DonationStep>("escolha");
  const [donationType, setDonationType] = useState<DonationType>(null);
  useBodyScrollLock(isOpen);

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
    const isThirdParty = form.isThirdParty;
    const donorName = form.nome.trim() || DEMO_DONOR_NAME;
    const donorPhone = form.telefone.trim() || undefined;
    const donation: Donation = {
      id: buildDonationId(),
      donorId: DEMO_DONOR_ID,
      donorName,
      donorPhone,
      donorSource: isThirdParty ? "terceiro" : "titular",
      profileOwnerId: DEMO_DONOR_ID,
      profileOwnerName: DEMO_DONOR_NAME,
      thirdPartyName: isThirdParty ? donorName : undefined,
      thirdPartyPhone: isThirdParty ? donorPhone : undefined,
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
    const isThirdParty = form.isThirdParty;
    const donorName = form.nome.trim() || DEMO_DONOR_NAME;
    const donorPhone = form.telefone.trim() || undefined;
    const donation: Donation = {
      id: buildDonationId(),
      donorId: DEMO_DONOR_ID,
      donorName,
      donorPhone,
      donorSource: isThirdParty ? "terceiro" : "titular",
      profileOwnerId: DEMO_DONOR_ID,
      profileOwnerName: DEMO_DONOR_NAME,
      thirdPartyName: isThirdParty ? donorName : undefined,
      thirdPartyPhone: isThirdParty ? donorPhone : undefined,
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

  const stepsOrder: DonationStep[] =
    donationType === "material"
      ? ["escolha", "material", "confirmacao"]
      : ["escolha", "financeira", "confirmacao"];
  const currentIndex = stepsOrder.indexOf(step);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== "confirmacao")
          handleClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-xl shadow-pink-100/40">
        {step !== "confirmacao" && (
          <div className="shrink-0 px-6 pb-4 pt-5">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-gray-400 shadow-sm transition-colors hover:bg-pink-50 hover:text-pink-600"
                aria-label="Fechar doação"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {stepsOrder.map((s, i) => {
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
          </div>
        )}

        <div
          className={
            step === "confirmacao"
              ? "pretty-scrollbar min-h-0 overflow-y-auto p-6"
              : "pretty-scrollbar min-h-0 overflow-y-auto px-6 pb-6"
          }
        >
          {step === "escolha" && (
            <DonationChoice
              selected={donationType}
              onSelect={setDonationType}
              onContinue={handleContinue}
              onCancel={handleClose}
            />
          )}

          {step === "financeira" && (
            <FinancialDonation
              onBack={handleBack}
              onConfirm={handleFinancialConfirm}
            />
          )}

          {step === "material" && (
            <MaterialDonation
              onBack={handleBack}
              onConfirm={handleMaterialConfirm}
            />
          )}

          {step === "confirmacao" && (
            <DonationConfirmation onClose={handleClose} />
          )}
        </div>
      </div>
    </div>
  );
}
