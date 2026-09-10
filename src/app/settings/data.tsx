/** LGPD na prática: consentimento registrado, exportação JSON completa, exclusão total de conta. */
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Screen } from '../../components/Screen'
import { useToast } from '../../components/Toast'
import { CONSENT_TEXT_PT, PRIVACY_SUMMARY_PT } from '../../domain/legal/texts'
import { useAuth } from '../../features/auth/AuthContext'
import { useApp } from '../../services/appContext'
import { buildExportPayload, exportToFile } from '../../services/export/exportData'
import { useAppTheme } from '../../theme/ThemeProvider'
import { shareFile } from '../../services/pdf/print'

export default function DataPrivacy() {
  const app = useApp()
  const { user, signOut, acceptConsent } = useAuth()
  const { theme, t } = useAppTheme()
  const toast = useToast()
  const [consentAt, setConsentAt] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [ackText, setAckText] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    const p = await app.profile.get()
    setConsentAt(p?.consent_at ?? null)
  }, [app])

  useEffect(() => {
    void refresh()
  }, [refresh, app.revision])

  const deleteAccount = useCallback(async () => {
    if (deleting) return
    if (ackText.trim().toUpperCase() !== 'EXCLUIR') {
      toast.show('Confirmação inválida: digite EXCLUIR.', 'error')
      return
    }

    setDeleting(true)
    let serverDeleted = false
    try {
      if (app.gateway.configured && user) {
        await app.gateway.deleteAllUserData()
        serverDeleted = true
      }

      await app.sync.wipeLocal()
      await signOut()

      toast.show(
        serverDeleted
          ? 'Conta excluída no servidor e dados locais apagados.'
          : 'Dados locais deste perfil foram apagados.'
      )
      router.replace('/(auth)/welcome')
    } catch {
      if (serverDeleted) {
        toast.show(
          'A conta foi excluída no servidor, mas a limpeza local não foi concluída. Tente limpar os dados locais novamente neste aparelho.',
          'error'
        )
      } else {
        toast.show(
          'A exclusão no servidor não foi concluída. Seus dados locais foram preservados para nova tentativa.',
          'error'
        )
      }
      setConfirming(false)
      setAckText('')
    } finally {
      setDeleting(false)
    }
  }, [ackText, app, deleting, signOut, toast, user])

  return (
    <Screen title="Privacidade e dados" subtitle="LGPD: acesso, portabilidade e eliminação nas suas mãos.">
      <Card heading="Base legal / consentimento">
        <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeCaption }}>
          {consentAt ? `Registrado em ${new Date(consentAt).toLocaleString('pt-BR')}.` : 'Ainda não registrado neste perfil.'}
        </Text>
        <ScrollView style={{ maxHeight: 260 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption, lineHeight: 18 }}>{CONSENT_TEXT_PT}</Text>
        </ScrollView>
        {!consentAt ? <Button label="Aceitar / registrar consentimento" onPress={() => void acceptConsent().then(refresh)} /> : null}
      </Card>

      <Card heading="Resumo de privacidade">
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption, lineHeight: 18 }}>{PRIVACY_SUMMARY_PT}</Text>
      </Card>

      <Card heading="Acesso e portabilidade">
        <Button
          label="Exportar meus dados (JSON)"
          variant="secondary"
          fullWidth
          disabled={busy || deleting}
          onPress={() => {
            if (busy || deleting) return
            setBusy(true)
            void (async () => {
              const [profile] = await app.db.select('local_profile', { limit: 1 })
              const payload = await buildExportPayload(app.db, profile ?? null)
              const uri = await exportToFile(payload)
              await shareFile(uri, 'Exportação dos seus dados').catch(() => toast.show('Arquivo gerado no aparelho.', 'info'))
            })().finally(() => setBusy(false))
          }}
        />
      </Card>

      <Card heading="Eliminação dos dados">
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
          Excluir a conta remove TODOS os registros do usuário no servidor (função SQL com RLS + cascade) e apaga o espelho local. Esta ação não é reversível.
        </Text>
        <Button
          label="Excluir minha conta e meus dados"
          variant="danger"
          fullWidth
          onPress={() => {
            if (!deleting) setConfirming(true)
          }}
          disabled={busy || deleting}
        />
      </Card>

      <Card heading="Confirmação de exclusão" style={confirming ? undefined : { display: 'none' }}>
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
          Seus registros de glicemia, lembretes, medicamentos e logs serão removidos do servidor e deste aparelho. Digite EXCLUIR para liberar o botão.
        </Text>
        <Input label="Confirmação" value={ackText} onChangeText={setAckText} />
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          <Button
            label={deleting ? 'Excluindo…' : 'Excluir minha conta'}
            variant="danger"
            disabled={deleting}
            onPress={() => void deleteAccount()}
          />
          <Button
            label="Cancelar"
            variant="text"
            disabled={deleting}
            onPress={() => {
              if (deleting) return
              setConfirming(false)
              setAckText('')
            }}
          />
        </View>
      </Card>
    </Screen>
  )
}
