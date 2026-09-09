/** Relatório mensal: KPIs, gráficos, tabela, dias sem registro, PDF e compartilhamento explícito. */
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { BarsChartView, ChartCard, LineChartView } from '../../components/ChartCard'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { MetricCard } from '../../components/MetricCard'
import { Screen } from '../../components/Screen'
import { daysInMonth, monthLabelPt } from '../../domain/dates/month'
import { buildBarsSpec, buildLineSpec } from '../../domain/reports/chart-spec'
import { computeMonthStats, MonthStats } from '../../domain/reports/statistics'
import { convertGlucose } from '../../domain/glucose/units'
import { CONTEXT_LABELS_PT } from '../../domain/glucose/contexts'
import { GlucoseUnit } from '../../domain/glucose/units'
import { generateReportFile, shareFile } from '../../services/pdf/print'
import { useApp } from '../../services/appContext'
import { useToast } from '../../components/Toast'
import { useAppTheme } from '../../theme/ThemeProvider'

export default function ReportScreen() {
  const app = useApp()
  const { theme, t } = useAppTheme()
  const toast = useToast()
  const params = useLocalSearchParams<{ month: string }>()
  const mk = params.month
  const [stats, setStats] = useState<MonthStats | null>(null)
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL')
  const [patient, setPatient] = useState('')
  const [band, setBand] = useState<{ min: number | null; max: number | null } | null>(null)
  const [pending, setPending] = useState(0)
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null)
  const [lastFile, setLastFile] = useState<string | null>(null)

  const load = useCallback(async () => {
    const profile = await app.profile.get()
    const u = profile?.unit ?? 'mg/dL'
    setUnit(u)
    setPatient(profile?.display_name ?? 'Paciente')
    const tgt = await app.targets.get('any')
    setBand(tgt ? { min: tgt.min != null ? convertGlucose(tgt.min, tgt.unit, u) : null, max: tgt.max != null ? convertGlucose(tgt.max, tgt.unit, u) : null } : null)
    const rows = await app.measurements.listByRange(`${mk}-01`, `${mk}-31`)
    setStats(
      computeMonthStats(rows, {
        monthKey: mk,
        daysInMonth: daysInMonth(mk),
        today: new Date().toISOString().slice(0, 10),
        displayUnit: u,
      })
    )
    setPending((await app.db.select('sync_outbox', { where: [{ col: 'table_name', op: '=', value: 'glucose_measurements' }] })).length)
  }, [app, mk])
  useEffect(() => {
    void load()
  }, [load, app.revision])

  const buildInput = useCallback(async () => {
    if (!stats) throw new Error('sem dados')
    const rows = await app.measurements.listByRange(`${mk}-01`, `${mk}-31`)
    return {
      patientName: patient,
      monthLabel: monthLabelPt(mk),
      generatedAt: new Date().toLocaleString('pt-BR'),
      stats,
      chart: buildLineSpec(stats, band),
      bars: buildBarsSpec(stats),
      rows,
      band,
    }
  }, [app, band, mk, patient, stats])

  const onPdf = useCallback(async () => {
    if (!stats || stats.total === 0) return
    setBusy('pdf')
    try {
      const file = await generateReportFile(await buildInput())
      setLastFile(file.uri)
      toast.show(file.kind === 'pdf' ? 'PDF gerado neste dispositivo.' : 'Relatório gerado (HTML do preview web).')
    } catch (e) {
      toast.show('Não foi possível gerar o arquivo neste ambiente.', 'error')
    } finally {
      setBusy(null)
    }
  }, [buildInput, stats, toast])

  const onShare = useCallback(async () => {
    setBusy('share')
    try {
      const uri = lastFile ?? (await generateReportFile(await buildInput())).uri
      if (!lastFile) setLastFile(uri)
      await shareFile(uri, 'Enviar relatório para…')
      toast.show('Compartilhamento iniciado por você.', 'info')
    } catch {
      toast.show('Este aparelho não pôde abrir o menu de envio. Gere o PDF e envie pelo app de arquivos.', 'error')
    } finally {
      setBusy(null)
    }
  }, [buildInput, lastFile, toast])

  if (!stats) {
    return <Screen title="Relatório" scroll={false}><></></Screen>
  }
  const empty = stats.total === 0
  return (
    <Screen
      title={`Relatório ${monthLabelPt(mk)}`}
      subtitle={empty ? 'Sem medições neste mês ainda.' : `${stats.total} medições · ${stats.daysWithRecords}/${stats.daysInMonth} dias com registro`}
    >
      {pending > 0 ? (
        <Card>
          <Text style={{ color: theme.colors.warning, fontWeight: '600', fontSize: t.typography.sizeCaption }}>
            📤 {pending} mediç(ões) deste período ainda “salva neste aparelho”. Elas entram no relatório local e serão
            sincronizadas — o compartilhamento não depende do servidor.
          </Text>
        </Card>
      ) : null}
      {empty ? (
        <EmptyState
          title="Nada para consolidar ainda"
          description="Registre medições (ou selecione outro mês). O relatório é gerado a partir dos seus registros."
          actionLabel="Registrar medição"
          onAction={() => router.push('/(app)/register')}
        />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
            <MetricCard label="Média" value={`${stats.mean} ${unit}`} />
            <MetricCard label="Mín / Máx" value={`${stats.min}–${stats.max}`} sublabel={unit} />
          </View>
          <ChartCard heading="Evolução diária (média do dia)">
            <LineChartView spec={buildLineSpec(stats, band)} caption={`Cada ponto é a média do dia em ${unit}. ${band?.min != null ? `Faixa sombreada: meta configurada ${band.min}–${band.max} ${unit} (definida por você).` : 'Você pode definir uma meta em Configurações para exibir a faixa de referência.'}`} />
          </ChartCard>
          <ChartCard heading="Média por contexto">
            <BarsChartView spec={buildBarsSpec(stats)} caption="Valores numéricos estão rotulados em cada barra — o gráfico não depende de cor." />
          </ChartCard>
          <Card heading="Resumo por contexto">
            {stats.byContext.map(c => (
              <Text key={c.context} style={{ color: theme.colors.text, fontSize: t.typography.sizeLabel }}>
                {CONTEXT_LABELS_PT[c.context]}: {c.count}× · média {c.mean} {unit}
              </Text>
            ))}
          </Card>
          <Card heading={`Tabela completa (${stats.total})`}>
            <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
              Data · Hora · Contexto · Glicemia · Observação — o PDF inclui todas as linhas; aqui, as 12 mais recentes.
            </Text>
          </Card>
          <Card heading="Dias sem registro">
            <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeLabel }}>
              {stats.daysWithout.length === 0 ? 'Nenhum dia sem registro no período.' : stats.daysWithout.map(d => d.split('-').reverse().join('/')).join(', ')}
            </Text>
          </Card>
          <View style={{ gap: t.spacing.sm }}>
            <Button label="🖨 Gerar PDF (no meu aparelho)" onPress={() => void onPdf()} loading={busy === 'pdf'} fullWidth />
            <Button label="📤 Compartilhar…" variant="secondary" onPress={() => void onShare()} disabled={busy !== null} fullWidth accessibilityHint="Abre o menu de envio do sistema; nada é enviado sozinho." />
            <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
              O compartilhamento começa quando VOCÊ escolhe o destino (WhatsApp, e-mail, arquivos). O relatório não sai do aparelho sozinho e não é enviado a nenhum servidor de terceiros.
            </Text>
          </View>
        </>
      )}
    </Screen>
  )
}
