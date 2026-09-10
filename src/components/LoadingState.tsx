import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'

export function LoadingState({ message = 'Carregando…' }: { message?: string }) {
  const { theme, t } = useAppTheme()
  return (
    <View accessibilityRole="progressbar" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: t.spacing.xl, gap: t.spacing.md, minHeight: 160 }}>
      <ActivityIndicator size="large" color={theme.colors.primary} testID="loading-state" />
      <Text style={{ color: theme.colors.textMuted }}>{message}</Text>
    </View>
  )
}
