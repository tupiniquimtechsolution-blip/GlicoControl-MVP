import { Link } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { router } from 'expo-router'
import { useAppTheme } from '../../theme/ThemeProvider'
import { isSupabaseConfigured } from '../../services/supabase/config'

export default function Welcome() {
  const { theme, t } = useAppTheme()
  const configured = isSupabaseConfigured()
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', padding: t.spacing.lg, gap: t.spacing.md }}>
      <Text style={{ color: theme.colors.text, fontSize: 34, fontWeight: '800' }}>GlicoControl</Text>
      <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeBody, lineHeight: 23 }}>
        Registre suas medições de glicemia, organize lembretes e gere um relatório mensal em PDF para
        levar ao seu profissional de saúde.{'\n'}O app não diagnostica, não prescreve e não ajusta
        tratamento — ele organiza os SEUS registros.
      </Text>
      <Card style={{ gap: t.spacing.md }}>
        <Button label="Criar conta" onPress={() => router.push('/(auth)/sign-up')} fullWidth />
        <Button label="Já tenho conta — Entrar" onPress={() => router.push('/(auth)/sign-in')} variant="secondary" fullWidth />
      </Card>
      {!configured ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }} accessibilityLiveRegion="polite">
          ℹ️ Backend não configurado neste ambiente (EXPO_PUBLIC_SUPABASE_URL / PUBLISHABLE_KEY no .env).
          Em builds de desenvolvimento, a flag EXPO_PUBLIC_DEMO_MODE=demo-local permite testar o app com
          dados locais no aparelho.
        </Text>
      ) : null}
      <Link href="/(auth)/reset" style={{ alignSelf: 'center', color: theme.colors.info, minHeight: t.touch.min, alignItems: 'center', justifyContent: 'center' }}>
        Esqueci minha senha
      </Link>
    </View>
  )
}
