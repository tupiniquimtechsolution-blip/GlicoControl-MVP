import { convertGlucose, mgDlToMmol, mmolToMgDl, formatGlucose, UNIT_MGDL, UNIT_MMOLL } from '../domain/glucose/units'
import { plausibilityConfirmText, validateGlucoseValue, isRealCalendarDate, validateDraft } from '../domain/glucose/validation'
import { isGlucoseContext } from '../domain/glucose/contexts'

describe('conversões de unidade (douradas)', () => {
  it('mg/dL → mmol/L com 1 casa', () => {
    expect(mgDlToMmol(90)).toBe(5.0)
    expect(mgDlToMmol(180)).toBe(10.0)
    expect(mgDlToMmol(72)).toBe(4.0)
    expect(mgDlToMmol(105)).toBe(5.8) // 105/18.0182=5.827→5.8
  })
  it('mmol/L → mg/dL inteiro', () => {
    expect(mmolToMgDl(5.5)).toBe(99)
    expect(mmolToMgDl(11.1)).toBe(200)
  })
  it('round-trip estável dentro da precisão de exibição', () => {
    for (const v of [55, 80, 126, 250, 600]) {
      const mmol = mgDlToMmol(v)
      const back = mmolToMgDl(mmol)
      expect(Math.abs(back - v)).toBeLessThanOrEqual(9)
    }
  })
  it('convertGlucose mesma unidade só normaliza', () => {
    expect(convertGlucose(100, UNIT_MGDL, UNIT_MGDL)).toBe(100)
    expect(convertGlucose(5.55, UNIT_MMOLL, UNIT_MMOLL)).toBe(5.6)
  })
  it('formatação', () => {
    expect(formatGlucose(126.4, UNIT_MGDL)).toBe('126')
    expect(formatGlucose(7.04, UNIT_MMOLL)).toBe('7.0')
  })
})

describe('validação (sem orientação clínica)', () => {
  it('recusa vazio/NaN/não-positivo', () => {
    expect(validateGlucoseValue('', 'mg/dL')).toEqual({ status: 'error', reason: 'empty' })
    expect(validateGlucoseValue('abc', 'mg/dL')).toEqual({ status: 'error', reason: 'nan' })
    expect(validateGlucoseValue('0', 'mg/dL')).toEqual({ status: 'error', reason: 'nonpositive' })
    expect(validateGlucoseValue('-5', 'mg/dL')).toEqual({ status: 'error', reason: 'nonpositive' })
  })
  it('aceita vírgula decimal pt-BR', () => {
    expect(validateGlucoseValue('5,5', 'mmol/L')).toEqual({ status: 'ok', value: 5.5 })
  })
  it('fora da plausibilidade pede apenas confirmação de digitação', () => {
    const r = validateGlucoseValue('750', 'mg/dL')
    expect(r.status).toBe('confirm')
    if (r.status === 'confirm') {
      const text = plausibilityConfirmText(r.value, 'mg/dL')
      expect(text).toMatch(/confirm/i)
      expect(text).not.toMatch(/procur[e|a] (um )?(médico|emergência)|dose|insulina|suspenda|pare de/i)
    }
  })
  it('recusa absurdo técnico', () => {
    expect(validateGlucoseValue('999999', 'mg/dL').status).toBe('error')
    expect(validateGlucoseValue('0.5', 'mg/dL').status).toBe('error') // <1 mg/dL é tecnicamente inválido
  })
  it('contextos válidos', () => {
    expect(isGlucoseContext('fasting')).toBe(true)
    expect(isGlucoseContext('antes do café')).toBe(false)
  })
  it('datas reais', () => {
    expect(isRealCalendarDate('2026-02-29')).toBe(false) // 2026 não é bissexto
    expect(isRealCalendarDate('2028-02-29')).toBe(true)
    expect(isRealCalendarDate('2026-04-31')).toBe(false)
  })
  it('draft completo valida tudo de uma vez', () => {
    const errs = validateDraft({ valueText: 'abc', unit: 'mg/dL', localDate: '2026-02-30', localTime: '25:70', context: 'fasting' as never, note: 'x'.repeat(501) })
    expect(Object.keys(errs).length).toBeGreaterThanOrEqual(4)
  })
})
