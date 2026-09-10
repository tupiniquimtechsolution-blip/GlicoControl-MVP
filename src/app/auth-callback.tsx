import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { useAuth } from '../features/auth/AuthContext'
import { getSupabase, mapAuthError } from '../services/supabase/client'
import { parseSupabaseAuthError, parseSupabaseAuthRedirect } from '../services/supabase/authRedirect'
import { useAppTheme } from '../theme/ThemeProvider'

type Mode = 'loading' | 'confirmed' | 'recovery' | 'done' | 'error'

function redirectErrorMessage(raw: string | null): string {
  if (!raw) return 'O link de autenticação é inválido ou não contém uma sessão utilizável.'
  if (/expired|otp_expired/i.test(raw)) return 'Este link expirou. Solicite um novo e tente novamente.'
  return mapAuthError(raw)
}

export default function AuthCallback() {
  const { theme, t } = useAppTheme()
  const { signOut } = useAuth()
  const url = Linking.useLinkingURL()
  const [mode, setMode] = useState<Mode>('loading')
  const [message, setMessage] = useState('Validando o link com segurança…')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!url) return
    let active = true

    void (async () => {
      const rawError = parseSupabaseAuthError(url)
      if (rawError) {
        if (active) {
          setMessage(redirectErrorMessage(rawError))
          setMode('error')
        }
        return
      }

      const redirect = parseSupabaseAuthRedirect(url)
      const supabase = getSupabase()
      if (!redirect || !supabase) {
        if (active) {
          setMessage(redirectErrorMessage(null))
          setMode('error')
        }
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token: redirect.accessToken,
        refresh_token: redirect.refreshToken,
      })
      if (!active) return
      if (error) {
        setMessage(mapAuthError(error.message))
        setMode('error')
        return
      }

      if (redirect.type === 'recovery') {
        setMessage('Defina uma nova senha para concluir a recuperação.')
        setMode('recovery')
        return
      }

      setMessage('E-mail confirmado. Sua conta está pronta para uso.')
      setMode('confirmed')
    })()

    return () => {
      active = false
    }
  }, [url])

  const savePassword = async () => {
    if (busy) return
    if (password.length < 8) {
      setMessage('A nova senha precisa de pelo menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setMessage('As duas senhas precisam ser iguais.')
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setMessage('Backend não configurado neste ambiente.')
      setMode('error')
      return
    }

    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage(mapAuthError(error.message))
      setBusy(false)
      return
    }

    // O link de recovery cria uma sessão. Após trocar a senha, encerramos essa sessão
    // e apagamos o espelho local para exigir login explícito com a nova credencial.
    await signOut()
    setPassword('')
    setConfirmPassword('')
    setMessage('Senha atualizada. Entre novamente usando a nova senha.')
    setMode('done')
    setBusy(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: t.spacing.lg }}>
      <Card style={{ gap: t.spacing.md }}>
        <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: t.typography.sizeHeadline, fontWeight: '800' }}>
          {mode === 'recovery' ? 'Criar nova senha' : mode === 'done' ? 'Senha atualizada' : 'GlicoControl'}
        </Text>
        <Text accessibilityLiveRegion="polite" style={{ color: mode === 'error' ? theme.colors.danger : theme.colors.text, fontSize: t.typography.sizeBody, lineHeight: 22 }}>
          {message}
        </Text>

        {mode === 'recovery' ? (
          <>
            <Input testID="recovery-password" label="Nova senha (mín. 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
            <Input testID="recovery-password-confirm" label="Confirmar nova senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry textContentType="newPassword" />
            <Button label="Salvar nova senha" loading={busy} onPress={() => void savePassword()} fullWidth />
          </>
        ) : null}

        {mode === 'confirmed' ? <Button label="Continuar para o app" onPress={() => router.replace('/(app)')} fullWidth /> : null}
        {mode === 'done' ? <Button label="Entrar com a nova senha" onPress={() => router.replace('/(auth)/sign-in')} fullWidth /> : null}
        {mode === 'error' ? <Button label="Voltar para entrar" onPress={() => router.replace('/(auth)/sign-in')} fullWidth /> : null}
      </Card>
    </View>
  )
}
