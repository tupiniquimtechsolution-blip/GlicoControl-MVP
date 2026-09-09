import { Link, Stack } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'

export default function NotFound() {
  const { theme, t } = useAppTheme()
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background, gap: t.spacing.md, padding: t.spacing.md }}>
        <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeHeadline, fontWeight: '800' }}>404</Text>
        <Link href="/(app)" style={{ color: theme.colors.primary, fontSize: t.typography.sizeTitle }}>← Voltar ao Início</Link>
      </View>
    </>
  )
}
