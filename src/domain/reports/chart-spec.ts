/** Especificação de gráficos — dados puros compartilhados por renderizador RN (react-native-svg)
 *  e renderizador PDF (string SVG). Nunca delegar escala a uma lib de charts. */
import { MonthStats } from './statistics'

export type LinePoint = { x: number; y: number; label: string; aria: string }
export type BarItem = { label: string; value: number; pct: number }

export type LineChartSpec = {
  width: number
  height: number
  padX: number
  padTop: number
  padBottom: number
  points: LinePoint[]
  yMin: number
  yMax: number
  xTicks: { x: number; label: string }[]
  bands?: { from: number; to: number } | null
}

export type BarsChartSpec = {
  width: number
  height: number
  bars: BarItem[]
  max: number
}

const W = 720
const H = 240

function niceCeil(v: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1))))
  return Math.ceil(v / pow) * pow
}

export function buildLineSpec(stats: MonthStats, band?: { min: number | null; max: number | null } | null): LineChartSpec {
  const padX = 44, padTop = 16, padBottom = 28
  const innerW = W - padX * 2
  const innerH = H - padTop - padBottom
  const values = stats.perDay.flatMap(p => [p.min, p.max, p.mean])
  const dataMin = values.length ? Math.min(...values) : 0
  const dataMax = values.length ? Math.max(...values) : 1
  const yMin = Math.max(0, Math.floor(dataMin * 0.9))
  const yMax = niceCeil(Math.ceil(dataMax * 1.1))
  const scaleX = (dayIdx: number) => padX + (stats.daysInMonth <= 1 ? innerW / 2 : (dayIdx / (stats.daysInMonth - 1)) * innerW)
  const scaleY = (v: number) => padTop + innerH - ((v - yMin) / Math.max(yMax - yMin, 1)) * innerH
  const points: LinePoint[] = stats.perDay.map(p => {
    const day = Number(p.date.slice(8, 10))
    return {
      x: scaleX(day - 1),
      y: scaleY(p.mean),
      label: String(day),
      aria: `dia ${day}: média ${p.mean} ${stats.unit}`,
    }
  })
  const xTicks: { x: number; label: string }[] = []
  for (let d = 1; d <= stats.daysInMonth; d += Math.max(1, Math.round(stats.daysInMonth / 10))) {
    xTicks.push({ x: scaleX(d - 1), label: String(d) })
  }
  const bands = band && band.min != null && band.max != null ? { from: scaleY(band.max), to: scaleY(band.min) } : null
  return { width: W, height: H, padX, padTop, padBottom, points, yMin, yMax, xTicks, bands }
}

export function buildBarsSpec(stats: MonthStats): BarsChartSpec {
  const max = Math.max(1, ...stats.byContext.map(c => c.mean))
  return { width: W, height: H, max, bars: stats.byContext.map(c => ({ label: c.label, value: c.mean, pct: c.mean / max })) }
}
