import { router } from 'expo-router'
import React, { useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { useAuth } from '../../features/auth/AuthContext'
import { useAppTheme } from '../../theme/ThemeProvider'

export default function Reset() {
  const { theme, t } = useAppTheme()
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: t.spacing.lg }}>
      <Card style={{ gap: t.spacing.md }}>
        <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: t.typography.sizeHeadline, fontWeight: '800' }}>Recuperar senha</Text>
        <Input label="E-mail da conta" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        {result ? (
          <Text accessibilityLiveRegion="polite" style={{ color: result.ok ? theme.colors.success : theme.colors.danger }}>
            {result.ok ? '✓ ' : '⚠ '}
            {result.message}
          </Text>
        ) : null}
        <Button
          label="Enviar link de redefinição"
          loading={loading}
          onPress={() => {
            setLoading(true)
            void sendPasswordReset(email).then(res => {
              setResult(res)
              setLoading(false)
            })
          }}
          fullWidth
        />
        <Button label="Voltar" variant="text" onPress={() => router.back()} />
      </Card>
    </View>
  )
}
