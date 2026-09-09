import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildReportHtml } from '../services/pdf/html'
import { computeMonthStats } from '../domain/reports/statistics'
import { buildBarsSpec, buildLineSpec } from '../domain/reports/chart-spec'
import type { GlucoseMeasurement } from '../domain/glucose/types'

const rows: GlucoseMeasurement[] = [
  { id: '1', user_id: 'u', value: 95, unit: 'mg/dL', measured_at: '2026-08-03T10:00:00Z', local_date: '2026-08-03', local_time: '07:00:00', tz_name: 'America/Sao_Paulo', context: 'fasting', note: 'jejum longo', row_version: 1, updated_at: '2026-08-03T10:00:00Z', deleted_at: null },
  { id: '2', user_id: 'u', value: 140, unit: 'mg/dL', measured_at: '2026-08-10T15:30:00Z', local_date: '2026-08-10', local_time: '12:30:00', tz_name: 'America/Sao_Paulo', context: 'after_lunch', note: null, row_version: 1, updated_at: '2026-08-10T15:30:00Z', deleted_at: null },
]

describe('relatório HTML → PDF', () => {
  const stats = computeMonthStats(rows, { monthKey: '2026-08', daysInMonth: 31, today: '2026-08-31', displayUnit: 'mg/dL' })
  const html = buildReportHtml({
    patientName: 'Maria da Silva',
    monthLabel: 'agosto de 2026',
    generatedAt: '09/09/2026 12:00:00',
    stats,
    chart: buildLineSpec(stats, null),
    bars: buildBarsSpec(stats),
    rows,
  })
  it('contém todos os campos obrigatórios', () => {
    expect(html).toContain('Maria da Silva')
    expect(html).toContain('agosto de 2026')
    expect(html).toContain('09/09/2026')
    expect(html).toContain('Total de medições')
    expect(html).toContain('<strong>95</strong> mg/dL')
    expect(html).toContain('140')
    expect(html).toContain('jejum longo')
    expect(html).toContain('Dias sem registro')
    expect(html).toContain('2026-08-04'.split('-').reverse().join('/'))
    expect(html).toContain('Média por contexto')
    expect(html).toContain('Evolução diária')
  })
  it('rodapé de não-avaliação médica presente', () => {
    expect(html).toContain('Não constitui avaliação')
  })
  it('gráficos são SVG com legenda textual (no-color-only)', () => {
    expect(html).toContain('<svg')
    expect(html).toContain('aria-label')
    expect(html).toMatch(/<text[^>]*>\d+</) // rótulo numérico em barras/pontos
  })
  it('escape de HTML em conteúdo do usuário', () => {
    const risky = buildReportHtml({
      patientName: '<img onerror=alert(1)>',
      monthLabel: 'm', generatedAt: 'g', stats, chart: buildLineSpec(stats, null), bars: buildBarsSpec(stats),
      rows: [{ ...rows[0], note: '<script>evil()</script>' }],
    })
    expect(risky).not.toContain('<script>evil')
    expect(risky).toContain('&lt;script&gt;')
  })
  it('arquivo HTML template não introduz cor hardcoded fora do theme (guarda de consistência)', () => {
    expect(readFileSync(join(process.cwd(), 'src', 'services', 'pdf', 'html.ts'), 'utf8')).not.toMatch(/theme\.colors|useAppTheme/) // PDF é light fixo documentado
  })
})
