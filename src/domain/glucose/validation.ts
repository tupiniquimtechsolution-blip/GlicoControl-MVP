/** Validação de medição (§22 do prompt mestre). Sem orientação clínica. */
import { isGlucoseContext } from './contexts'
import { MeasurementDraft } from './types'
import { GLUCOSE_UNITS, GlucoseUnit } from './units'

/** Faixas de digitação plausível — fora delas pede-se apenas confirmação de digitação. */
export const PLAUSIBLE_RANGES: Record<GlucoseUnit, { min: number; max: number }> = {
  'mg/dL': { min: 20, max: 600 },
  'mmol/L': { min: 1, max: 33 },
}

export type ValueValidation =
  | { status: 'ok'; value: number }
  | { status: 'error'; reason: 'empty' | 'nan' | 'nonpositive' | 'outofrange' }
  | { status: 'confirm'; value: number }

export function validateGlucoseValue(raw: string, unit: GlucoseUnit): ValueValidation {
  const text = (raw ?? '').trim().replace(',', '.')
  if (!text) return { status: 'error', reason: 'empty' }
  const value = Number(text)
  if (!Number.isFinite(value)) return { status: 'error', reason: 'nan' }
  if (value <= 0) return { status: 'error', reason: 'nonpositive' }
  const range = PLAUSIBLE_RANGES[unit]
  if (value < 1 || value > 5000 || (unit === 'mg/dL' && value > 999.5)) {
    return { status: 'error', reason: 'outofrange' }
  }
  if (value < range.min || value > range.max) return { status: 'confirm', value: roundByUnit(value, unit) }
  return { status: 'ok', value: roundByUnit(value, unit) }
}

function roundByUnit(v: number, unit: GlucoseUnit): number {
  return unit === 'mg/dL' ? Math.round(v) : Math.round(v * 10) / 10
}

export const VALUE_ERROR_MESSAGES_PT: Record<'empty' | 'nan' | 'nonpositive' | 'outofrange', string> = {
  empty: 'Informe o valor da medição.',
  nan: 'Valor inválido: use apenas números.',
  nonpositive: 'O valor deve ser maior que zero.',
  outofrange: 'Valor fora da faixa que o app aceita para registro.',
}

export const CONFIRM_PLAUSIBILITY_PT =
  'O valor informado está fora da faixa de digitação plausível para a unidade selecionada. Confirme se não houve erro de digitação.'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^(\d{2}):(\d{2})(:\d{2})?$/

export function isRealCalendarDate(ymd: string): boolean {
  if (!DATE_RE.test(ymd)) return false
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

export function validateDraft(draft: MeasurementDraft): Partial<Record<keyof MeasurementDraft, string>> {
  const errors: Partial<Record<keyof MeasurementDraft, string>> = {}
  const v = validateGlucoseValue(draft.valueText, draft.unit)
  if (v.status === 'error') errors.valueText = VALUE_ERROR_MESSAGES_PT[v.reason]
  if (!isRealCalendarDate(draft.localDate)) errors.localDate = 'Data inválida.'
  if (!TIME_RE.test(draft.localTime)) errors.localTime = 'Horário inválido.'
  else {
    const [h, min] = draft.localTime.split(':').map(Number)
    if (h > 23 || min > 59) errors.localTime = 'Horário inválido.'
  }
  if (!isGlucoseContext(draft.context)) errors.context = 'Selecione um contexto.'
  if (!GLUCOSE_UNITS.includes(draft.unit)) errors.unit = 'Unidade inválida.'
  if (draft.note && draft.note.length > 500) errors.note = 'Observação: use no máximo 500 caracteres.'
  return errors
}

/** Texto de confirmação de plausibilidade — o único "alerta" permitido (nenhum conselho clínico). */
export function plausibilityConfirmText(value: number, unit: GlucoseUnit): string {
  return `${CONFIRM_PLAUSIBILITY_PT}\n\nValor digitado: ${roundByUnit(value, unit)} ${unit}`
}
