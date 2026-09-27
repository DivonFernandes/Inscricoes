export function cleanCpf(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  if (cpf === cpf[0].repeat(11)) return false;

  const calcDigit = (slice: string, startFactor: number): string => {
    let total = 0;
    let factor = startFactor;
    for (const ch of slice) {
      total += Number(ch) * factor;
      factor -= 1;
    }
    const resto = total % 11;
    return resto < 2 ? "0" : String(11 - resto);
  };

  const dig1 = calcDigit(cpf.slice(0, 9), 10);
  const dig2 = calcDigit(cpf.slice(0, 10), 11);
  return cpf[9] === dig1 && cpf[10] === dig2;
}
