/**
 * Remove todos os caracteres não dígitos
 * @example normalizeCpf("123.456.789-10") => "12345678910"
 */
export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formata CPF para o padrão: XXX.XXX.XXX-XX
 * @example formatCpf("12345678910") => "123.456.789-10"
 */
export function formatCpf(value: string): string {
  const cpfDigits = normalizeCpf(value).slice(0, 11);
  return cpfDigits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
