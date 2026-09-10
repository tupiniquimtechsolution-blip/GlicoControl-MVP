/** Estatísticas do relatório mensal — puras e determinísticas (§12 do prompt mestre). */
import { CONTEXT_LABELS_PT, CONTEXT_ORDER, GlucoseContext } from '../glucose/contexts'
import { GlucoseMeasurement } from '../glucose/types'
import { convertGlucose, GlucoseUnit } from '../glucose/units'

export type MonthStats = {
  unit: GlucoseUnit
  total: number
  daysWithRecords: number
  daysInMonth: number
  daysWithout: string[] // YYYY-MM-DD sem registro (dentro do mês, e <= hoje quando o mês é corrente)
  mean: number | null
  min: number | null
  max: number | null
  byContext: { context: GlucoseContext; label: string; count: number; mean: number }[]
  perDay: { date: string; mean: number; min: number; max: number; count: number }[]
}

export type MonthStatsInput = {
  monthKey: string // YYYY-MM
  daysInMonth: number
  /** hoje local (YYYY-MM-DD): limita "dias sem registro" no mês corrente */
  today: string
  /** unidade de exibição desejada */
  displayUnit: GlucoseUnit
}

export function computeMonthStats(measurements: GlucoseMeasurement[], input: MonthStatsInput): MonthStats {
  const { monthKey, daysInMonth, today, displayUnit } = input
  const inMonth = measurements.filter(m => m.deleted_at === null && m.local_date.startsWith(monthKey))

  const byDate = new Map<string, number[]>() // date -> valores já na unidade de exibição
  const byCtx = new Map<GlucoseContext, number[]>()
  for (const m of inMonth) {
    const v = convertGlucose(m.value, m.unit, displayUnit)
    ;(byDate.get(m.local_date) ?? byDate.set(m.local_date, []).get(m.local_date)!).push(v)
    ;(byCtx.get(m.context) ?? byCtx.set(m.context, []).get(m.context)!).push(v)
  }

  const all = [...byDate.values()].flat()
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const round = (v: number) => (displayUnit === 'mg/dL' ? Math.round(v) : Math.round(v * 10) / 10)

  const perDay = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vs]) => ({
      date,
      mean: round(avg(vs)),
      min: round(Math.min(...vs)),
      max: round(Math.max(...vs)),
      count: vs.length,
    }))

  const lastRelevantDay = Math.min(daysInMonth, Number(today.startsWith(monthKey) ? today.slice(8, 10) : daysInMonth))
  const daysWithout: string[] = []
  for (let d = 1; d <= lastRelevantDay; d++) {
    const key = `${monthKey}-${String(d).padStart(2, '0')}`
    if (!byDate.has(key)) daysWithout.push(key)
  }

  const byContext = CONTEXT_ORDER.filter(c => byCtx.has(c)).map(c => {
    const vs = byCtx.get(c)!
    return { context: c, label: CONTEXT_LABELS_PT[c], count: vs.length, mean: round(avg(vs)) }
  })

  return {
    unit: displayUnit,
    total: inMonth.length,
    daysWithRecords: byDate.size,
    daysInMonth,
    daysWithout,
    mean: all.length ? round(avg(all)) : null,
    min: all.length ? round(Math.min(...all)) : null,
    max: all.length ? round(Math.max(...all)) : null,
    byContext,
    perDay,
  }
}

/** resumo do dia para o dashboard (número puro, sem interpretação) */
export function computeDaySummary(measurements: GlucoseMeasurement[], date: string, displayUnit: GlucoseUnit) {
  const rows = measurements.filter(m => m.deleted_at === null && m.local_date === date)
  const vs = rows.map(m => convertGlucose(m.value, m.unit, displayUnit))
  const round = (v: number) => (displayUnit === 'mg/dL' ? Math.round(v) : Math.round(v * 10) / 10)
  return {
    count: rows.length,
    mean: vs.length ? round(vs.reduce((a, b) => a + b, 0) / vs.length) : null,
    min: vs.length ? round(Math.min(...vs)) : null,
    max: vs.length ? round(Math.max(...vs)) : null,
  }
}
