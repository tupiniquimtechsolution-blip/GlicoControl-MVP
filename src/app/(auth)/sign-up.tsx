import { router } from 'expo-router'
import React, { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { CONSENT_TEXT_PT } from '../../domain/legal/texts'
import { useAuth } from '../../features/auth/AuthContext'
import { useAppTheme } from '../../theme/ThemeProvider'

export default function SignUp() {
  const { theme, t } = useAppTheme()
  const { signUp, authError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null)

  if (confirmationMessage) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background, padding: t.spacing.lg }}>
        <Card style={{ gap: t.spacing.md }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: t.typography.sizeHeadline, fontWeight: '800' }}>
            Confirme seu e-mail
          </Text>
          <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.text, fontSize: t.typography.sizeBody, lineHeight: 22 }}>
            {confirmationMessage}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
            O link deve abrir o GlicoControl. Se não encontrar a mensagem, confira também a caixa de spam.
          </Text>
          <Button label="Ir para entrar" onPress={() => router.replace('/(auth)/sign-in')} fullWidth />
        </Card>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', backgroundColor: theme.colors.background, padding: t.spacing.lg }}>
      <Card style={{ gap: t.spacing.md }}>
        <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: t.typography.sizeHeadline, fontWeight: '800' }}>Criar conta</Text>
        <Input label="Nome (para o relatório)" value={name} onChangeText={v => { setName(v); clearError() }} helper="Opcional. Se informado, aparece no PDF que você apresenta ao profissional de saúde." />
        <Input label="E-mail" value={email} onChangeText={v => { setEmail(v); clearError() }} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
        <Input label="Senha (mín. 8 caracteres)" value={password} onChangeText={v => { setPassword(v); clearError() }} secureTextEntry textContentType="newPassword" />
        <View>
          <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeBody, lineHeight: 21 }}>{CONSENT_TEXT_PT}</Text>
          <Button
            label={consent ? '✓ Consentimento registrado' : '☐ Li e aceito os termos acima'}
            variant={consent ? 'primary' : 'secondary'}
            onPress={() => setConsent(v => !v)}
            fullWidth
          />
        </View>
        {authError ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger }}>⚠ {authError}</Text> : null}
        <Button
          label="Criar conta"
          loading={loading}
          onPress={() => {
            setLoading(true)
            void signUp(email, password, name, consent).then(result => {
              setLoading(false)
              if (!result.ok) return
              if (result.needsEmailConfirmation) {
                setConfirmationMessage(result.message)
                return
              }
              router.replace('/(app)')
            })
          }}
          fullWidth
        />
        <Button label="Voltar" variant="text" onPress={() => router.back()} />
      </Card>
    </ScrollView>
  )
}
