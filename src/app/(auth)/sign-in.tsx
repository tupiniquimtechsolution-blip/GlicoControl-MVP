import { router } from 'expo-router'
import React, { useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { useAuth } from '../../features/auth/AuthContext'
import { useAppTheme } from '../../theme/ThemeProvider'

export default function SignIn() {
  const { theme, t } = useAppTheme()
  const { signIn, authError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: t.spacing.lg }}>
      <Card style={{ gap: t.spacing.md }}>
        <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: t.typography.sizeHeadline, fontWeight: '800' }}>Entrar</Text>
        <Input testID="login-email" label="E-mail" value={email} onChangeText={v => { setEmail(v); clearError() }} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" autoComplete="email" accessibilityHint="E-mail usado no cadastro" />
        <Input testID="login-password" label="Senha" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="password" />
        {authError ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger }}>⚠ {authError}</Text> : null}
        <Button
          label="Entrar"
          loading={loading}
          onPress={() => {
            setLoading(true)
            void signIn(email, password).then(ok => {
              setLoading(false)
              if (ok) router.replace('/(app)')
            })
          }}
          fullWidth
        />
        <Button label="Esqueci minha senha" variant="text" onPress={() => router.push('/(auth)/reset')} />
      </Card>
    </View>
  )
}
