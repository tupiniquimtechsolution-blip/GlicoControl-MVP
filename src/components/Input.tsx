import React from 'react'
import { Text, TextInput, TextInputProps, View } from 'react-native'

import { useAppTheme } from '../theme/ThemeProvider'

type Props = TextInputProps & {
  label: string
  error?: string
  helper?: string
  /** rótulo da unidade exibido como sufixo (ex.: "mg/dL") */
  suffix?: string
}

/** Input com label associada + erro anunciado para leitores de tela (polite). */
export function Input({ label, error, helper, suffix, style, multiline, ...rest }: Props) {
  const { theme, t } = useAppTheme()
  const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <View style={{ gap: 4 }}>
      <Text
        nativeID={inputId}
        style={{ color: theme.colors.text, fontSize: t.typography.sizeLabel, fontWeight: '600' }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: theme.colors.surface,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          borderWidth: error ? 2 : 1,
          borderRadius: t.radius.md,
          paddingHorizontal: t.spacing.md,
        }}
      >
        <TextInput
          {...rest}
          multiline={multiline}
          accessibilityLabel={label}
          // id/nativeID já ligam o label; accessibilityLabel garante getByLabelText em RTL

          accessibilityValue={suffix ? { text: `${String(rest.value ?? '')} ${suffix}` } : undefined}
          id={inputId}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            {
              flex: 1,
              color: theme.colors.text,
              fontSize: t.typography.sizeBody,
              paddingVertical: t.spacing.sm + 4,
              minHeight: t.touch.min,
            },
            style,
          ]}
        />
        {suffix ? <Text style={{ color: theme.colors.textMuted, paddingLeft: 6, fontSize: t.typography.sizeBody }}>{suffix}</Text> : null}
      </View>
      {helper && !error ? <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>{helper}</Text> : null}
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: theme.colors.danger, fontSize: t.typography.sizeCaption }}
        >
          ⚠ {error}
        </Text>
      ) : null}
    </View>
  )
}