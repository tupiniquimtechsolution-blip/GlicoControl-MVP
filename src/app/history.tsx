/** Histórico com filtros por intervalo, contexto e unidade de exibição. */
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { MeasurementCard } from '../components/MeasurementCard'
import { Screen } from '../components/Screen'
import { CONTEXT_LABELS_PT, GLUCOSE_CONTEXTS, GlucoseContext } from '../domain/glucose/contexts'
import type { GlucoseMeasurement } from '../domain/glucose/types'
import { GLUCOSE_UNITS, GlucoseUnit } from '../domain/glucose/units'
import { todayYmd } from '../domain/dates/month'
import { useApp } from '../services/appContext'
import { useAppTheme } from '../theme/ThemeProvider'
import { DateTimeField } from '../components/DateTimeField'

export default function HistoryScreen() {
  const app = useApp()
  const { theme, t } = useAppTheme()
  const [rows, setRows] = useState<GlucoseMeasurement[]>([])
  const [from, setFrom] = useState(`${todayYmd().slice(0, 8)}01`)
  const [to, setTo] = useState(todayYmd())
  const [ctx, setCtx] = useState<'all' | GlucoseContext>('all')
  const [unit, setUnit] = useState<GlucoseUnit>('mg/dL')
  const [filterOpen, setFilterOpen] = useState(false)

  const refresh = useCallback(async () => {
    const profile = await app.profile.get()
    if (profile) setUnit(profile.unit)
    const all = await app.measurements.listByRange(from, to)
    setRows(ctx === 'all' ? all : all.filter(r => r.context === ctx))
  }, [app, ctx, from, to])
  useEffect(() => {
    void refresh()
  }, [refresh, app.revision])

  return (
    <Screen title="Histórico" subtitle={`${rows.length} registro(s) entre ${from.split('-').reverse().join('/')} e ${to.split('-').reverse().join('/')}`}>
      <View style={{ gap: t.spacing.sm }}>
        <Button label={filterOpen ? 'Ocultar filtros' : 'Filtros'} variant="secondary" onPress={() => setFilterOpen(v => !v)} fullWidth />
        {filterOpen ? (
          <Card style={{ gap: t.spacing.sm }}>
            <DateTimeField label="De" localDate={from} localTime="00:00" onChange={d => setFrom(d)} />
            <DateTimeField label="Até" localDate={to} localTime="23:59" onChange={d => setTo(d)} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(['all', ...GLUCOSE_CONTEXTS] as const).map(c => (
                <Button
                  key={c}
                  label={c === 'all' ? 'Todos os contextos' : CONTEXT_LABELS_PT[c]}
                  variant={ctx === c ? 'primary' : 'secondary'}
                  onPress={() => setCtx(c)}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {GLUCOSE_UNITS.map(u => (
                <Button key={u} label={`Exibir ${u}`} variant={unit === u ? 'primary' : 'secondary'} onPress={() => setUnit(u)} />
              ))}
            </View>
          </Card>
        ) : null}
        {rows.length === 0 ? (
          <EmptyState title="Nada neste intervalo" description="Ajuste os filtros ou registre uma medição." actionLabel="Registrar" onAction={() => router.push('/(app)/register')} />
        ) : (
          <View style={{ gap: t.spacing.sm }}>
            {rows.map(m => (
              <MeasurementCard key={m.id} measurement={m} displayUnit={unit} onPress={() => router.push({ pathname: '/(app)/register', params: { id: m.id } } as never)} />
            ))}
          </View>
        )}
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
          A edição usa a mesma unidade em que o registro foi salvo; a exibição pode mudar sem alterar o dado.
        </Text>
      </View>
    </Screen>
  )
}
