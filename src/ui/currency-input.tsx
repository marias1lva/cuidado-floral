import * as React from "react";

import { Input } from "./input";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  return currencyFormatter.format(Number(digits) / 100);
}

export function parseCurrencyInput(value: string): number | undefined {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }

  const normalized = Number(digits) / 100;
  return Number.isFinite(normalized) ? normalized : undefined;
}

interface CurrencyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "type" | "onChange" | "value"
> {
  value: string;
  onValueChange: (value: string) => void;
}

export function CurrencyInput({
  value,
  onValueChange,
  ...props
}: CurrencyInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(event) =>
        onValueChange(formatCurrencyInput(event.target.value))
      }
    />
  );
}
