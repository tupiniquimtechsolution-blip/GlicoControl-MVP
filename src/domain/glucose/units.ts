/** Conversões canônicas de unidade glicêmica. Regra: armazenar como digitado + unit;
 *  conversão é exibicional. mg/dL: inteiro; mmol/L: 1 casa (padrão BR/IFCC). */
export const UNIT_MGDL = 'mg/dL' as const
export const UNIT_MMOLL = 'mmol/L' as const
export type GlucoseUnit = typeof UNIT_MGDL | typeof UNIT_MMOLL
export const GLUCOSE_UNITS: GlucoseUnit[] = [UNIT_MGDL, UNIT_MMOLL]

/** Fator IFCC: 1 mmol/L = 18.0182 mg/dL */
export const MMOL_TO_MGDL = 18.0182

export function mgDlToMmol(mgdl: number): number {
  return Math.round((mgdl / MMOL_TO_MGDL) * 10) / 10
}

export function mmolToMgDl(mmol: number): number {
  return Math.round(mmol * MMOL_TO_MGDL)
}

/** Converte `value`, dado na unidade `from`, para a unidade `to` (com a precisão de exibição de `to`). */
export function convertGlucose(value: number, from: GlucoseUnit, to: GlucoseUnit): number {
  if (from === to) return from === UNIT_MGDL ? Math.round(value) : Math.round(value * 10) / 10
  return from === UNIT_MGDL ? mgDlToMmol(value) : mmolToMgDl(value)
}

export function formatGlucose(value: number, unit: GlucoseUnit): string {
  return unit === UNIT_MGDL ? String(Math.round(value)) : (Math.round(value * 10) / 10).toFixed(1)
}
