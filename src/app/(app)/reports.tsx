/** Relatórios: escolha do mês (últimos 24) + entrada rápida no mês corrente. */
import { router } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Screen } from '../../components/Screen'
import { monthKey, monthLabelPt, recentMonthKeys } from '../../domain/dates/month'
import { useAppTheme } from '../../theme/ThemeProvider'

export default function ReportsHub() {
  const { theme, t } = useAppTheme()
  const months = recentMonthKeys(24)
  return (
    <Screen title="Relatórios" subtitle="O relatório mensal organiza seus registros para a consulta. Nada é enviado automaticamente.">
      <Card style={{ gap: t.spacing.sm }}>
        <Text accessibilityRole="header" style={{ color: theme.colors.text, fontWeight: '800', fontSize: t.typography.sizeTitle }}>
          {monthLabelPt(monthKey(new Date()))}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>Mês em andamento — o PDF considera os registros já salvos.</Text>
        <Button label="Abrir relatório deste mês" onPress={() => router.push(`/reports/${monthKey(new Date())}` as never)} fullWidth />
      </Card>
      <Card heading="Meses anteriores">
        <View style={{ gap: 4 }}>
          {months.slice(1).map(m => (
            <Button key={m} label={monthLabelPt(m)} variant="text" onPress={() => router.push(`/reports/${m}` as never)} fullWidth />
          ))}
        </View>
      </Card>
    </Screen>
  )
}
