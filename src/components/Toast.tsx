/** Toast simples com fila (sem lib externa). Mensagens anunciadas para leitores de tela. */
import React, { createContext, useCallback, useContext, useState } from 'react'
import { Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'

export type ToastKind = 'success' | 'info' | 'error'
type ToastItem = { id: number; text: string; kind: ToastKind }

type ToastApi = { show: (text: string, kind?: ToastKind) => void }
const Ctx = createContext<ToastApi>({ show: () => {} })

let nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = nextId++
    setItems(list => [...list, { id, text, kind }])
    setTimeout(() => setItems(list => list.filter(i => i.id !== id)), 3800)
  }, [])
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <ToastLayer items={items} />
    </Ctx.Provider>
  )
}

function ToastLayer({ items }: { items: ToastItem[] }) {
  const { theme, t } = useAppTheme()
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center', gap: 6 }} accessibilityLiveRegion="polite">
      {items.map(i => (
        <View
          key={i.id}
          style={{
            maxWidth: '92%',
            backgroundColor: theme.colors.surface,
            borderStartWidth: 6,
            borderStartColor: i.kind === 'error' ? theme.colors.danger : i.kind === 'info' ? theme.colors.info : theme.colors.success,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: t.radius.md,
            padding: t.spacing.sm + 2,
          }}
        >
          <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeLabel }}>
            {i.kind === 'error' ? '❌ ' : i.kind === 'info' ? 'ℹ️ ' : '✅ '}
            {i.text}
          </Text>
        </View>
      ))}
    </View>
  )
}

export function useToast(): ToastApi {
  return useContext(Ctx)
}