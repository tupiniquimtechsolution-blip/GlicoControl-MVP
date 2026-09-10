import React, { useState } from 'react'
import { FlatList, Modal, Pressable, Text, View } from 'react-native'

import { overlay } from '../theme/tokens'
import { useAppTheme } from '../theme/ThemeProvider'
import { Button } from './Button'

export type SelectOption<T extends string> = { value: T; label: string; hint?: string }

/** Seleção acessível em modal (radios reais, anunciáveis), em vez de spinner nativo não tematizável. */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  helper,
}: {
  label: string
  value: T
  options: SelectOption<T>[]
  onChange: (v: T) => void
  error?: string
  helper?: string
}) {
  const { theme, t } = useAppTheme()
  const [open, setOpen] = useState(false)
  const current = options.find(o => o.value === value)
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeLabel, fontWeight: '600' }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? 'não selecionado'}`}
        onPress={() => setOpen(true)}
        style={{
          minHeight: t.touch.min,
          borderRadius: t.radius.md,
          borderWidth: error ? 2 : 1,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: t.spacing.md,
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ flex: 1, color: theme.colors.text, fontSize: t.typography.sizeBody }}>{current?.label ?? 'Selecione…'}</Text>
        <Text style={{ color: theme.colors.textMuted }}>▾</Text>
      </Pressable>
      {helper && !error ? <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>{helper}</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger, fontSize: t.typography.sizeCaption }}>⚠ {error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} accessibilityViewIsModal>
        <View style={{ flex: 1, backgroundColor: overlay.scrim, justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: t.radius.lg, borderTopRightRadius: t.radius.lg, padding: t.spacing.md, maxHeight: '80%' }}>
            <Text accessibilityRole="header" style={{ color: theme.colors.text, fontWeight: '700', fontSize: t.typography.sizeTitle }}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={o => o.value}
              style={{ marginVertical: t.spacing.sm }}
              renderItem={({ item }) => {
                const selected = item.value === value
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onChange(item.value)
                      setOpen(false)
                    }}
                    style={{ minHeight: t.touch.large, flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingHorizontal: t.spacing.sm, borderRadius: t.radius.sm }}
                  >
                    <Text style={{ color: selected ? theme.colors.primary : theme.colors.textMuted, fontSize: 18 }}>{selected ? '◉' : '○'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeBody }}>{item.label}</Text>
                      {item.hint ? <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>{item.hint}</Text> : null}
                    </View>
                  </Pressable>
                )
              }}
            />
            <Button label="Fechar" variant="text" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  )
}