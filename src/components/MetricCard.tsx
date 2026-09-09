import React from 'react'
import { Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'
import { Card } from './Card'

export function MetricCard({ label, value, sublabel, tone }: { label: string; value: string; sublabel?: string; tone?: 'neutral' | 'attention' }) {
  const { theme, t } = useAppTheme()
  // tom SEM texto extra: estado sempre textual; cor só reforça (regra no-color-only)
  const color = tone === 'attention' ? theme.colors.warning : theme.colors.text
  return (
    <Card testID={`metric-${label}`} style={{ flex: 1, minWidth: 130 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color, fontSize: t.typography.sizeHeadline, fontWeight: '800' }} accessibilityRole="text">{value}</Text>
      {sublabel ? <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>{sublabel}</Text> : null}
    </Card>
  )
}
