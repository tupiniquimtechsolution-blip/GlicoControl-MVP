import React from 'react'
import { Pressable, Text } from 'react-native'

import { useAppTheme } from '../theme/ThemeProvider'

export function Chip({
  label,
  selected,
  onPress,
  size = 'md',
}: {
  label: string
  selected: boolean
  onPress: () => void
  size?: 'md' | 'sm'
}) {
  const { theme, t } = useAppTheme()
  const c = theme.colors
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}${selected ? ', selecionado' : ''}`}
      onPress={onPress}
      style={{
        minHeight: size === 'sm' ? 36 : t.touch.min,
        paddingHorizontal: t.spacing.sm + 4,
        borderRadius: t.radius.full,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? c.primary : c.border,
        backgroundColor: selected ? (theme.dark ? c.surfaceAlt : c.secondary) : c.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size === 'sm' ? t.typography.sizeCaption : t.typography.sizeLabel,
          fontWeight: selected ? '700' : '500',
          color: c.text,
        }}
      >
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  )
}
