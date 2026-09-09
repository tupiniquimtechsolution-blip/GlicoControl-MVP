import React from 'react'
import { Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'
import { Button } from './Button'

export function EmptyState({ title, description, actionLabel, onAction, icon }: {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: string
}) {
  const { theme, t } = useAppTheme()
  return (
    <View style={{ alignItems: 'center', padding: t.spacing.xl, gap: t.spacing.sm }} testID="empty-state">
      {icon ? <Text style={{ fontSize: 34 }}>{icon}</Text> : null}
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: t.typography.sizeTitle, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      {description ? <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: t.typography.sizeBody }}>{description}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  )
}
