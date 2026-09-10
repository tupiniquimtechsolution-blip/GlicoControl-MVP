import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import React, { useState } from 'react'

import { useAppTheme } from '../theme/ThemeProvider'
import { spacing } from '../theme/tokens'

type Props = {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'text'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  testID?: string
  iconOnly?: boolean
  accessibilityHint?: string
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, fullWidth, iconOnly, accessibilityHint, testID }: Props) {
  const { theme, t } = useAppTheme()
  const c = theme.colors
  const isPrimary = variant === 'primary'
  const isDanger = variant === 'danger'
  const isText = variant === 'text'
  const style = {
    backgroundColor: isPrimary ? c.primary : isText ? 'transparent' : c.surface,
    borderColor: isDanger ? c.danger : isText ? 'transparent' : c.border,
    borderWidth: isText || isPrimary ? 0 : 1.5,
  }
  const textColor = isPrimary ? c.onPrimary : isDanger ? c.danger : isText ? c.primary : c.text
  const [pressed, setPressed] = useState(false)
  const pressStyle = [
    styles.base,
    {
      minHeight: iconOnly ? t.touch.min : t.touch.large,
      paddingHorizontal: iconOnly ? t.spacing.sm : t.spacing.md,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
      borderRadius: t.radius.md,
      opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      alignSelf: (fullWidth ? 'stretch' : 'flex-start') as 'stretch' | 'flex-start',
    },
  ]
  return (
    <Pressable
        testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={pressStyle}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" testID="button-loading" />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize: t.typography.sizeLabel }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', paddingVertical: spacing.sm, minWidth: 44 },
  text: { fontWeight: '600' },
})
