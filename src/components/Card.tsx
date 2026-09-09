import React from 'react'
import { StyleSheet, Text, View, ViewProps } from 'react-native'

import { useAppTheme } from '../theme/ThemeProvider'

export function Card({ children, style, heading, testID }: ViewProps & { heading?: string; testID?: string }) {
  const { theme, t } = useAppTheme()
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: t.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          padding: t.spacing.md,
          gap: t.spacing.sm,
        },
        style,
      ]}
    >
      {heading ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption, fontWeight: '600', textTransform: 'uppercase' }} accessibilityRole="header">
          {heading}
        </Text>
      ) : null}
      {children}
    </View>
  )
}
