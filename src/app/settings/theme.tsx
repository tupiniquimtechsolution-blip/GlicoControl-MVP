/** Seletor dos 5 temas + system; persistência imediata (AsyncStorage) e sync da preferência. */
import React from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Screen } from '../../components/Screen'
import { themeLabelsPt, themeOrder } from '../../theme/palette'
import { themes } from '../../theme/palette'
import { useAppTheme } from '../../theme/ThemeProvider'
import { useApp } from '../../services/appContext'
import { useAuth } from '../../features/auth/AuthContext'

export default function ThemeSettings() {
  const { theme, preference, setPreference, t } = useAppTheme()
  const app = useApp()
  const { user } = useAuth()
  const choose = (pref: Parameters<typeof setPreference>[0]) => {
    setPreference(pref)
    if (user) void app.gateway.upsertProfile(user.id, { theme: pref }).catch(() => undefined)
  }
  return (
    <Screen title="Tema" subtitle="Cinco temas, todos com contraste testado. Nenhum depende de cor para indicar estado clínico.">
      <Card>
        <Button label={preference === 'system' ? '◉ Seguir o sistema (claro/escuro)' : '○ Seguir o sistema'} variant={preference === 'system' ? 'primary' : 'secondary'} onPress={() => choose('system')} fullWidth />
      </Card>
      {themeOrder.map(name => {
        const tt = themes[name]
        const selected = preference === name
        return (
          <Card key={name} style={{ borderWidth: selected ? 2 : 1, borderColor: selected ? theme.colors.primary : theme.colors.border }}>
            <View style={{ gap: t.spacing.sm }}>
              <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: t.typography.sizeTitle }}>{themeLabelsPt[name]}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['background', 'surface', 'primary', 'secondary', 'accent', 'danger'] as const).map(tok => (
                  <View key={tok} accessibilityLabel={`amostra de cor ${tok}`} style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: tt.colors[tok], borderWidth: 1, borderColor: theme.colors.border }} />
                ))}
              </View>
              <View style={{ backgroundColor: tt.colors.surface, borderRadius: t.radius.sm, padding: t.spacing.sm, borderWidth: 1, borderColor: tt.colors.border }}>
                <Text style={{ color: tt.colors.text }}>Aa 128 mg/dL</Text>
                <Text style={{ color: tt.colors.textMuted, fontSize: 12 }}>Texto secundário de exemplo — Jejum, 07:00</Text>
              </View>
              <Button label={selected ? '✓ Selecionado' : 'Usar este tema'} variant={selected ? 'primary' : 'secondary'} onPress={() => choose(name)} fullWidth />
            </View>
          </Card>
        )
      })}
    </Screen>
  )
}