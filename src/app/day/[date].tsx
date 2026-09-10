/** Dia selecionado: medições em ordem cronológica + edição rápida. */
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { MeasurementCard } from '../../components/MeasurementCard'
import { Screen } from '../../components/Screen'
import { dateLongLabelPt } from '../../domain/dates/month'
import type { GlucoseMeasurement } from '../../domain/glucose/types'
import { useApp } from '../../services/appContext'
import { useAppTheme } from '../../theme/ThemeProvider'

export default function DayScreen() {
  const app = useApp()
  const { theme, t } = useAppTheme()
  const { date } = useLocalSearchParams<{ date: string }>()
  const [rows, setRows] = useState<GlucoseMeasurement[] | null>(null)
  const [unit, setUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL')

  const refresh = useCallback(async () => {
    const profile = await app.profile.get()
    setUnit(profile?.unit ?? 'mg/dL')
    setRows(await app.measurements.listByDay(date))
  }, [app, date])
  useEffect(() => {
    void refresh()
  }, [refresh, app.revision])

  return (
    <Screen title={dateLongLabelPt(date ?? '')} subtitle={rows && !rows.length ? 'Este dia está sem registro.' : rows ? `${rows.length} registro(s)` : undefined}>
      {rows === null ? null : rows.length === 0 ? (
        <EmptyState title="Nenhuma medição neste dia" description="Você pode registrar agora com a data/hora ajustáveis." actionLabel="Registrar neste dia" onAction={() => router.push('/(app)/register')} />
      ) : (
        <View style={{ gap: t.spacing.sm }}>
          {rows.map(m => (
            <MeasurementCard key={m.id} measurement={m} displayUnit={unit} onPress={() => router.push({ pathname: '/(app)/register', params: { id: m.id } } as never)} />
          ))}
          <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
            Toque em uma medição para editar ou excluir (com confirmação).
          </Text>
        </View>
      )}
      <Button label="← Voltar ao calendário" variant="text" onPress={() => router.back()} />
    </Screen>
  )
}
