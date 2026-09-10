/** Calendário mensal: contagens textuais por dia (nunca só cor), navegação de meses, dia → detalhes. */
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { CalendarDay } from '../../components/CalendarDay'
import { Card } from '../../components/Card'
import { Screen } from '../../components/Screen'
import { buildMonthGrid, monthKey, monthLabelPt, shiftMonth, todayYmd } from '../../domain/dates/month'
import { useApp } from '../../services/appContext'
import { useAppTheme } from '../../theme/ThemeProvider'
import { weekdayLabelsPt } from '../../domain/dates/month'

export default function CalendarScreen() {
  const app = useApp()
  const { theme, t } = useAppTheme()
  const [mk, setMk] = useState(monthKey(new Date()))
  const [counts, setCounts] = useState<Record<string, number>>({})

  const refresh = useCallback(async () => {
    setCounts(await app.measurements.dayCounts(mk))
  }, [app, mk])
  useEffect(() => {
    void refresh()
  }, [refresh, app.revision])

  const cells = buildMonthGrid(mk)
  const today = todayYmd()
  const withCount = cells.filter(c => c.inMonth && (counts[c.date] ?? 0) > 0).length
  const totalDays = cells.filter(c => c.inMonth).length
  const daysWithout = totalDays - cells.filter(c => c.inMonth && today >= c.date && (counts[c.date] ?? 0) > 0).length

  return (
    <Screen
      title="Calendário"
      headerRight={<Button label="🗂️" iconOnly variant="text" onPress={() => router.push('/history' as never)} accessibilityHint="Abrir histórico com filtros" />}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing.sm }}>
          <Button label="◀" iconOnly variant="text" onPress={() => setMk(shiftMonth(mk, -1))} accessibilityHint="Mês anterior" />
          <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.text, fontWeight: '800', fontSize: t.typography.sizeTitle, textTransform: 'capitalize' }}>
            {monthLabelPt(mk)}
          </Text>
          <Button label="▶" iconOnly variant="text" onPress={() => setMk(shiftMonth(mk, 1))} accessibilityHint="Próximo mês" />
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
          {weekdayLabelsPt().map(d => (
            <Text key={d} style={{ flex: 1, textAlign: 'center', color: theme.colors.textMuted, fontSize: t.typography.sizeCaption, fontWeight: '700' }}>
              {d}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
          {cells.map(cell => (
            <View key={cell.date} style={{ width: '13.6%' }}>
              <CalendarDay
                cell={cell}
                count={counts[cell.date]}
                isToday={cell.date === today}
                isFuture={cell.date > today}
                onPress={() => router.push({ pathname: '/day/[date]', params: { date: cell.date } } as never)}
              />
            </View>
          ))}
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption, marginTop: t.spacing.sm }}>
          ✓ = dia com registro · 0 = dia sem registro · hoje tem borda destacada. {withCount} dia(s) com medições neste mês.
        </Text>
        {daysWithout > 0 ? (
          <Text style={{ color: theme.colors.warning, fontSize: t.typography.sizeCaption, fontWeight: '700' }}>
            {daysWithout} dia(s) ainda sem registro neste mês (inclui dias futuros não contados).
          </Text>
        ) : null}
      </Card>
      <Button label="Ir para hoje" variant="secondary" onPress={() => setMk(monthKey(new Date()))} />
    </Screen>
  )
}