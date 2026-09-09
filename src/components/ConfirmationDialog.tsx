import React from 'react'
import { Modal, Text, View } from 'react-native'
import { overlay } from '../theme/tokens'
import { useAppTheme } from '../theme/ThemeProvider'
import { Button } from './Button'

/** Confirmação acessível (substitui Alert nativo): foco inicial em Cancelar; ações por texto, não cor. */
export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  onConfirm,
  onCancel,
}: {
  visible: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}) {
  const { theme, t } = useAppTheme()
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
      testID="confirmation-dialog"
    >
      <View style={{ flex: 1, backgroundColor: overlay.scrim, alignItems: 'center', justifyContent: 'center', padding: t.spacing.md }}>
        <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.colors.surface, borderRadius: t.radius.lg, padding: t.spacing.md, gap: t.spacing.md }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: t.typography.sizeTitle, fontWeight: '700' }}>
            {title}
          </Text>
          {message ? <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeBody, lineHeight: t.typography.sizeBody * t.typography.lineHeightBody }}>{message}</Text> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
            <Button label={cancelLabel} onPress={onCancel} variant="secondary" />
            <Button label={confirmLabel} onPress={onConfirm} variant={tone === 'danger' ? 'danger' : 'primary'} />
          </View>
        </View>
      </View>
    </Modal>
  )
}
