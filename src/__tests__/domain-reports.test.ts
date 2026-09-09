import { computeDaySummary, computeMonthStats } from '../domain/reports/statistics'
import type { GlucoseMeasurement } from '../domain/glucose/types'

const mk = (over: Partial<GlucoseMeasurement>): GlucoseMeasurement => ({
  id: Math.random().toString(36).slice(2),
  user_id: 'u1',
  value: 100,
  unit: 'mg/dL',
  measured_at: '2026-09-05T10:00:00Z',
  local_date: '2026-09-05',
  local_time: '07:00:00',
  tz_name: 'America/Sao_Paulo',
  context: 'fasting',
  note: null,
  row_version: 1,
  updated_at: '2026-09-05T10:00:00Z',
  deleted_at: null,
  ...over,
})

describe('estatísticas do relatório', () => {
  it('total, dias com/sem, média mín máx', () => {
    const stats = computeMonthStats(
      [mk({ local_date: '2026-09-01' }), mk({ local_date: '2026-09-01', local_time: '12:00:00', context: 'after_lunch', value: 150 }), mk({ local_date: '2026-09-03' })],
      { monthKey: '2026-09', daysInMonth: 30, today: '2026-09-30', displayUnit: 'mg/dL' }
    )
    expect(stats.total).toBe(3)
    expect(stats.daysWithRecords).toBe(2)
    expect(stats.daysWithout.length).toBe(28)
    expect(stats.daysWithout[0]).toBe('2026-09-02')
    expect(stats.min).toBe(100)
    expect(stats.max).toBe(150)
    expect(stats.mean).toBe(117) // (100+150+100)/3 = 116.67→117
  })
  it('mês corrente: não conta dias futuros como "sem registro"', () => {
    const stats = computeMonthStats([mk({})], { monthKey: '2026-09', daysInMonth: 30, today: '2026-09-06', displayUnit: 'mg/dL' })
    expect(stats.daysWithout).toEqual(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-06'])
    expect(stats.daysWithout.every(d => d <= '2026-09-06')).toBe(true)
  })
  it('ignora soft-deleted', () => {
    const stats = computeMonthStats([mk({ deleted_at: '2026-09-10T00:00:00Z' })], { monthKey: '2026-09', daysInMonth: 30, today: '2026-09-30', displayUnit: 'mg/dL' })
    expect(stats.total).toBe(0)
  })
  it('agrupa por contexto e converte ANTES de agregar', () => {
    const stats = computeMonthStats(
      [mk({ value: 90, unit: 'mg/dL' }), mk({ value: 5, unit: 'mmol/L', local_time: '08:00:00' })],
      { monthKey: '2026-09', daysInMonth: 30, today: '2026-09-30', displayUnit: 'mmol/L' }
    )
    const fasting = stats.byContext.find(c => c.context === 'fasting')
    expect(fasting?.count).toBe(2)
    expect(fasting?.mean).toBe(5) // 90 mg/dL → 5.0 mmol/L; 5.0 e 5.0 → média 5.0 (agregação na unidade de exibição)
  })
  it('resumo do dia', () => {
    const day = computeDaySummary([mk({ value: 80 }), mk({ value: 120 })], '2026-09-05', 'mg/dL')
    expect(day).toMatchObject({ count: 2, min: 80, max: 120, mean: 100 })
  })
})
