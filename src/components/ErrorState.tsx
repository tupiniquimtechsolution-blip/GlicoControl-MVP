import React from 'react'
import { Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'
import { Button } from './Button'

export function ErrorState({ message, onRetry, offline }: { message: string; onRetry?: () => void; offline?: boolean }) {
  const { theme, t } = useAppTheme()
  return (
    <View style={{ alignItems: 'center', padding: t.spacing.lg, gap: t.spacing.sm }} accessibilityLiveRegion="polite" testID="error-state">
      <Text style={{ fontSize: 28 }}>{offline ? '📡' : '⚠️'}</Text>
      <Text style={{ color: offline ? theme.colors.text : theme.colors.danger, fontWeight: '700', fontSize: t.typography.sizeBody, textAlign: 'center' }}>
        {offline ? 'Modo offline' : 'Ops, algo deu errado'}
      </Text>
      <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>{message}</Text>
      {onRetry ? <Button label="Tentar novamente" onPress={onRetry} variant="secondary" /> : null}
    </View>
  )
}
