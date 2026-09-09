/** Construtor do HTML do relatório mensal — puro e determinístico (testado em node).
 *  O PDF no aparelho é gerado por expo-print a partir DESTE html; no preview web vira download .html. */
import { LineChartSpec, BarsChartSpec } from '../../domain/reports/chart-spec'
import { MonthStats } from '../../domain/reports/statistics'
import { GlucoseMeasurement } from '../../domain/glucose/types'
import { CONTEXT_LABELS_PT } from '../../domain/glucose/contexts'
import { formatGlucose } from '../../domain/glucose/units'
import { PDF_FOOTER_PT } from '../../domain/legal/texts'

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

export function lineSvg(spec: LineChartSpec, title: string): string {
  const { width, height, points, yMin, yMax, xTicks, padTop, padBottom, bands } = spec
  const path = points.length ? `M ${points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}` : ''
  const dots = points.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.2" fill="#14532d"/>`).join('')
  const band = bands ? `<rect x="${spec.padX}" y="${Math.min(bands.from, bands.to).toFixed(1)}" width="${(width - spec.padX * 2).toFixed(1)}" height="${Math.abs(bands.to - bands.from).toFixed(1)}" fill="#16a34a" opacity="0.08"/>` : ''
  const ticks = xTicks.map(t => `<text x="${t.x.toFixed(1)}" y="${(height - 8).toFixed(1)}" font-size="10" text-anchor="middle" fill="#444">${t.label}</text>`).join('')
  return `<svg role="img" aria-label="${esc(title)}" width="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">
  ${band}
  <line x1="${spec.padX}" y1="${(height - padBottom).toFixed(1)}" x2="${width - spec.padX}" y2="${(height - padBottom).toFixed(1)}" stroke="#666" stroke-width="1"/>
  <line x1="${spec.padX}" y1="${padTop}" x2="${spec.padX}" y2="${(height - padBottom).toFixed(1)}" stroke="#666" stroke-width="1"/>
  <text x="${spec.padX - 6}" y="${padTop + 4}" font-size="10" text-anchor="end" fill="#444">${yMax}</text>
  <text x="${spec.padX - 6}" y="${(height - padBottom).toFixed(1)}" font-size="10" text-anchor="end" fill="#444">${yMin}</text>
  ${path ? `<path d="${path}" fill="none" stroke="#14532d" stroke-width="2"/>` : ''}
  ${dots}
  ${ticks}
</svg>`
}

export function barsSvg(spec: BarsChartSpec, title: string): string {
  const n = Math.max(1, spec.bars.length)
  const inner = spec.width - 88
  const bw = Math.min(64, inner / n - 12)
  const bars = spec.bars
    .map((b, i) => {
      const h = Math.max(2, b.pct * (spec.height - 44))
      const x = 44 + (inner / n) * i + (inner / n - bw) / 2
      const y = spec.height - 24 - h
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="#14532d"/>
      <text x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" font-size="10" text-anchor="middle" fill="#14532d">${b.value}</text>
      <text x="${(x + bw / 2).toFixed(1)}" y="${spec.height - 10}" font-size="9" text-anchor="middle" fill="#444">${esc(b.label.replace(/^(Antes|Depois) do /, ''))}</text>`
    })
    .join('')
  return `<svg role="img" aria-label="${esc(title)}" width="100%" viewBox="0 0 ${spec.width} ${spec.height}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%">
  <line x1="44" y1="${spec.height - 24}" x2="${spec.width - 44}" y2="${spec.height - 24}" stroke="#666" stroke-width="1"/>
  ${bars}
</svg>`
}

export type ReportInput = {
  patientName: string
  monthLabel: string
  generatedAt: string
  stats: MonthStats
  chart: LineChartSpec
  bars: BarsChartSpec
  rows: GlucoseMeasurement[]
  band?: { min: number | null; max: number | null } | null
}

export function buildReportHtml(input: ReportInput): string {
  const { patientName, monthLabel, generatedAt, stats, rows } = input
  const unit = stats.unit
  const kpi = (label: string, value: string) => `<div class="kpi"><div class="kpi-l">${esc(label)}</div><div class="kpi-v">${esc(value)}</div></div>`
  const table = rows
    .slice()
    .sort((a, b) => (a.local_date === b.local_date ? a.local_time.localeCompare(b.local_time) : a.local_date.localeCompare(b.local_date)))
    .map(
      m => `<tr>
      <td>${m.local_date.split('-').reverse().join('/')}</td>
      <td>${m.local_time.slice(0, 5)}</td>
      <td>${esc(CONTEXT_LABELS_PT[m.context])}</td>
      <td><strong>${formatGlucose(m.value, m.unit)}</strong> ${m.unit}</td>
      <td>${m.note ? esc(m.note) : '—'}</td>
    </tr>`
    )
    .join('')
  const noDays = stats.daysWithout.length
    ? stats.daysWithout.map(d => d.split('-').reverse().join('/')).join(', ')
    : 'Nenhum dia sem registro no período exibido.'
  const ctxRows = stats.byContext.map(c => `<tr><td>${esc(c.label)}</td><td>${c.count}</td><td>${c.mean} ${unit}</td></tr>`).join('')

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>Relatório ${esc(monthLabel)} — ${esc(patientName)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color:#111827; background:#fff; margin:24px; font-size:13px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .muted { color:#4b5563; }
  .grid { display:flex; flex-wrap:wrap; gap:10px; margin:14px 0; }
  .kpi { border:1px solid #d1d5db; border-radius:10px; padding:8px 12px; min-width:110px; }
  .kpi-l { font-size:11px; color:#4b5563; }
  .kpi-v { font-size:16px; font-weight:700; }
  table { border-collapse:collapse; width:100%; margin-top:8px; }
  th,td { border:1px solid #d1d5db; padding:5px 8px; text-align:left; font-size:12px; }
  th { background:#f3f4f6; }
  .footer { margin-top:18px; padding-top:8px; border-top:1px solid #d1d5db; font-size:11px; color:#4b5563; }
  .section { margin-top:20px; }
</style></head>
<body>
  <h1>Relatório mensal de glicemia</h1>
  <div class="muted">Paciente: <strong>${esc(patientName || '—')}</strong> · Período: ${esc(monthLabel)} · Gerado em: ${esc(generatedAt)} · Unidade principal: ${unit}</div>
  <div class="grid">
    ${kpi('Total de medições', String(stats.total))}
    ${kpi('Dias com registro', `${stats.daysWithRecords}/${stats.daysInMonth}`)}
    ${kpi('Dias sem registro', String(stats.daysWithout.length))}
    ${kpi('Média', stats.mean != null ? `${stats.mean} ${unit}` : '—')}
    ${kpi('Mínimo', stats.min != null ? `${stats.min} ${unit}` : '—')}
    ${kpi('Máximo', stats.max != null ? `${stats.max} ${unit}` : '—')}
  </div>
  <div class="section"><strong>Evolução diária</strong> — linha = média do dia (unidade: ${unit}).<br/>${lineSvg(input.chart, 'Gráfico de evolução diária')}</div>
  <div class="section"><strong>Média por contexto</strong><br/>${barsSvg(input.bars, 'Média por contexto')}</div>
  <div class="section"><strong>Resumo por contexto</strong>
    <table><thead><tr><th>Contexto</th><th>Medições</th><th>Média</th></tr></thead><tbody>${ctxRows || '<tr><td colspan="3">Sem medições no período.</td></tr>'}</tbody></table>
  </div>
  <div class="section"><strong>Tabela completa (${rows.length} registros)</strong>
    <table><thead><tr><th>Data</th><th>Hora</th><th>Contexto</th><th>Glicemia</th><th>Observação</th></tr></thead><tbody>${table || '<tr><td colspan="5">Sem registros.</td></tr>'}</tbody></table>
  </div>
  <div class="section"><strong>Dias sem registro</strong><div class="muted">${esc(noDays)}</div></div>
  <div class="footer">${esc(PDF_FOOTER_PT)}</div>
</body></html>`
}
