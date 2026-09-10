/** Dashboard: última medição, resumo do dia, próximas ações, atalhos e aviso de virada de mês. */
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { MetricCard } from '../../components/MetricCard'
import { MeasurementCard } from '../../components/MeasurementCard'
import { Screen } from '../../components/Screen'
import { monthKey, todayYmd } from '../../domain/dates/month'
import { computeDaySummary } from '../../domain/reports/statistics'
import { convertGlucose, GlucoseUnit } from '../../domain/glucose/units'
import type { Target as GlucoseTarget } from '../../services/repositories/targetRepo'
import { useAuth } from '../../features/auth/AuthContext'
import { useApp } from '../../services/appContext'
import { useAppTheme } from '../../theme/ThemeProvider'
import type { GlucoseMeasurement } from '../../domain/glucose/types'

type DashboardData = {
  displayName: string
  unit: GlucoseUnit
  day: ReturnType<typeof computeDaySummary>
  last: GlucoseMeasurement | null
  consentNeeded: boolean
  nudgeMonth: string | null
}

function prevMonthOf(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

function relativeTimePt(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.floor(h / 24)} dia(s)`
}

export default function Dashboard() {
  const app = useApp()
  const { acceptConsent } = useAuth()
  const { theme, t } = useAppTheme()
  const [data, setData] = useState<DashboardData | null>(null)
  const [band, setBand] = useState<GlucoseTarget | null>(null)
  const [nextGlucose, setNextGlucose] = useState<{ label: string; time: string } | null>(null)
  const [nextMed, setNextMed] = useState<{ name: string; dose: string; time: string; id: string } | null>(null)

  const reload = useCallback(async () => {
    const profile = await app.profile.get()
    const unit = profile?.unit ?? 'mg/dL'
    const today = todayYmd()
    const rows = await app.measurements.listByRange(`${new Date().getFullYear() - 1}-01-01`, '9999-12-31')
    const cur = monthKey(new Date())
    const seen = await app.db.getMeta('dashboard.seen-month')
    await app.db.setMeta('dashboard.seen-month', cur)
    const day = computeDaySummary(rows, today, unit)
    setData({
      displayName: profile?.display_name || 'Olá',
      unit,
      day,
      last: rows[0] ?? null,
      consentNeeded: !!profile && !profile.consent_at,
      nudgeMonth: seen && seen !== cur ? prevMonthOf(cur) : null,
    })
    setBand(await app.targets.get('any'))
    const now = new Date()
    const hh = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const reminders = (await app.reminders.list()).filter(r => r.enabled && r.days_of_week.includes(now.getDay()))
    reminders.sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
    const upcoming = reminders.find(r => r.time_of_day.slice(0, 5) >= hh) ?? reminders[0]
    setNextGlucose(upcoming ? { label: upcoming.label, time: upcoming.time_of_day.slice(0, 5) } : null)
    const due = await app.medications.nextDue()
    setNextMed(due ? { name: due.medication.name, dose: due.medication.dose_text, time: due.schedule.time_of_day.slice(0, 5), id: due.medication.id } : null)
  }, [app])

  useEffect(() => {
    void reload()
  }, [reload, app.revision])

  if (!data) {
    return (
      <Screen title="Início" subtitle="Carregando…" scroll={false}>
        <></>
      </Screen>
    )
  }

  const bandView = band ? { min: band.min, max: band.max } : null
  const lastShown = data.last ? { ...data.last, value: convertGlucose(data.last.value, data.last.unit, data.unit), unit: data.unit } : null

  return (
    <Screen
      title="Início"
      subtitle={data.displayName}
      headerRight={<Button label="⚙️" iconOnly variant="text" onPress={() => router.push('/settings' as never)} accessibilityHint="Abrir configurações" />}
    >
      {data.consentNeeded ? (
        <Card heading="Consentimento" testID="consent-card">
          <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeBody, lineHeight: 22 }}>
            Para manter seus registros com segurança, confirme o consentimento de tratamento dos dados que você
            cadastra (LGPD). Você pode exportar ou excluir tudo em Configurações › Privacidade.
          </Text>
          <Button label="Confirmar consentimento" onPress={() => void acceptConsent().then(reload)} />
        </Card>
      ) : null}

      {data.nudgeMonth ? (
        <Card heading="Novo mês começou" testID="month-nudge">
          <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeBody }}>
            O mês virou. Quando quiser, gere o relatório do mês anterior para levar à consulta.
          </Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
            <Button label={`Gerar relatório de ${data.nudgeMonth.split('-').reverse().join('/')}`} onPress={() => router.push(`/reports/${data.nudgeMonth}` as never)} />
            <Button label="Agora não" variant="text" onPress={() => setData(d => (d ? { ...d, nudgeMonth: null } : d))} />
          </View>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
        <MetricCard label="Medições hoje" value={String(data.day.count)} sublabel={data.day.mean != null ? `média ${data.day.mean} ${data.unit}` : 'nenhuma medição ainda'} />
        <MetricCard label="Mín / Máx hoje" value={data.day.min != null ? `${data.day.min}–${data.day.max}` : '—'} sublabel={data.day.min != null ? data.unit : undefined} />
      </View>

      <Card heading="Última medição" testID="last-measurement-card">
        {lastShown ? (
          <>
            <MeasurementCard measurement={lastShown} displayUnit={data.unit} targetBand={bandView} onPress={() => router.push('/history' as never)} />
            {data.last ? (
              <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>registrada {relativeTimePt(data.last.measured_at)}</Text>
            ) : null}
          </>
        ) : (
          <EmptyState
            title="Nenhuma medição ainda"
            description="Registre sua primeira glicemia — leva poucos segundos e funciona até sem internet."
            actionLabel="Registrar agora"
            onAction={() => router.push('/(app)/register')}
          />
        )}
      </Card>

      <Card heading="Próxima medição programada" testID="next-glucose">
        {nextGlucose ? (
          <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeBody }}>
            Hoje às <Text style={{ fontWeight: '800' }}>{nextGlucose.time}</Text> — {nextGlucose.label}
          </Text>
        ) : (
          <>
            <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeBody }}>Nenhum lembrete ativo para hoje.</Text>
            <Button label="Configurar lembretes" variant="text" onPress={() => router.push('/(app)/reminders')} />
          </>
        )}
      </Card>

      <Card heading="Próximo medicamento" testID="next-medication">
        {nextMed ? (
          <View style={{ gap: t.spacing.sm }}>
            <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeBody }}>
              {nextMed.name} · {nextMed.dose} · previsto para <Text style={{ fontWeight: '800' }}>{nextMed.time}</Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
              <Button label="✓ Tomei" onPress={() => void app.medications.logAction(nextMed.id, null, 'taken').then(reload)} />
              <Button label="⏰ Adiar 10 min" variant="secondary" onPress={() => void app.medications.logAction(nextMed.id, null, 'snoozed').then(reload)} />
            </View>
            <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
              Estes botões registram apenas o que você confirmar. Nada é marcado automaticamente ao receber o lembrete.
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeBody }}>Nenhum horário de medicação previsto para agora.</Text>
            <Button label="Gerenciar medicamentos" variant="text" onPress={() => router.push('/medications' as never)} />
          </>
        )}
      </Card>

      <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Button label="➕ Registrar medição" onPress={() => router.push('/(app)/register')} fullWidth />
        </View>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Button label="📄 Relatório do mês" variant="secondary" onPress={() => router.push(`/reports/${monthKey(new Date())}` as never)} fullWidth />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 160 }}>
          <Button label="🗂️ Ver histórico" variant="text" onPress={() => router.push('/history' as never)} fullWidth />
        </View>
      </View>
    </Screen>
  )
}
