/** Menu de configurações (perfil, tema, unidade, metas, privacidade/LGPD, medicamentos, sair). */
import { router } from 'expo-router'
import React from 'react'
import { Text } from 'react-native'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Screen } from '../components/Screen'
import { useAuth } from '../features/auth/AuthContext'
import { useAppTheme } from '../theme/ThemeProvider'

export default function Settings() {
  const { user, signOut, isDemo } = useAuth()
  const { theme, t } = useAppTheme()
  return (
    <Screen title="Configurações">
      <Card style={{ gap: 6 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: t.typography.sizeTitle }}>Conta</Text>
        <Text style={{ color: theme.colors.textMuted }}>{user?.email || (isDemo ? 'demonstração local' : 'sessão ativa')}</Text>
      </Card>
      <Card style={{ gap: t.spacing.sm }}>
        <Button label="🎨 Tema (cinco opções)" variant="text" fullWidth onPress={() => router.push('/settings/theme' as never)} />
        <Button label="👤 Perfil, unidade e metas" variant="text" fullWidth onPress={() => router.push('/settings/profile' as never)} />
        <Button label="🔐 Privacidade e dados (LGPD)" variant="text" fullWidth onPress={() => router.push('/settings/data' as never)} />
        <Button label="💊 Medicamentos" variant="text" fullWidth onPress={() => router.push('/medications' as never)} />
      </Card>
      <Button label="Sair da conta" variant="danger" onPress={() => void signOut().then(() => router.replace('/(auth)/welcome'))} fullWidth />
      <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
        Ao sair, os dados locais deste espelho são apagados (política do app). Suas informações permanecem no seu
        usuário no servidor, protegidas por autenticação.
      </Text>
    </Screen>
  )
}
