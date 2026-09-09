import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'
import { useApp } from '../services/appContext'

/** Estado de sincronização SEMPRE com texto (nunca apenas cor): "salvo neste aparelho" etc. */
export function SyncStatusBadge({ onPress }: { onPress?: () => void }) {
  const { theme, t } = useAppTheme()
  const { sync } = useApp()
  const [status, setStatus] = React.useState(sync.getStatus())
  React.useEffect(() => sync.subscribe(setStatus), [sync])

  const label =
    status.state === 'running'
      ? `Sincronizando (${status.pending})…`
      : status.state === 'offline'
        ? status.pending > 0 ? `Offline · ${status.pending} p/ enviar` : 'Offline · dados salvos aqui'
        : status.pending > 0
          ? `${status.pending} pendente${status.pending > 1 ? 's' : ''} de envio`
          : status.state === 'error'
            ? 'Erro ao sincronizar (nada foi perdido)'
            : 'Sincronizado'
  const icon = status.state === 'error' ? '⚠️' : status.state === 'offline' ? '📡' : status.pending > 0 ? '📤' : '🗂️'
  const color = status.state === 'error' ? theme.colors.danger : theme.colors.textMuted
  return (
    <Pressable onPress={onPress} accessibilityRole="text" accessibilityLabel={`Estado de sincronização: ${label}`} style={{ paddingHorizontal: t.spacing.sm, paddingVertical: 3, borderRadius: t.radius.full, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignSelf: 'flex-start', minWidth: t.touch.min, minHeight: 26, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color, fontSize: t.typography.sizeCaption }}>
        {icon} {label}
      </Text>
    </Pressable>
  )
}
