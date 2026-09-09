import Ionicons from '@expo/vector-icons/Ionicons'
import { Redirect, Tabs } from 'expo-router'
import React from 'react'

import { useAuth } from '../../features/auth/AuthContext'
import { useAppTheme } from '../../theme/ThemeProvider'

export default function AppLayout() {
  const { status } = useAuth()
  const { theme } = useAppTheme()
  if (status === 'loading') return null
  if (status === 'signed-out') return <Redirect href="/(auth)/welcome" />
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size ?? 24} color={color} />, tabBarAccessibilityLabel: 'Aba 1 de 5: Início' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendário', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size ?? 24} color={color} />, tabBarAccessibilityLabel: 'Aba 2 de 5: Calendário' }} />
      <Tabs.Screen name="register" options={{ title: 'Registrar', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={(size ?? 24) + 6} color={color} />, tabBarAccessibilityLabel: 'Aba 3 de 5: Registrar medição' }} />
      <Tabs.Screen name="reminders" options={{ title: 'Lembretes', tabBarIcon: ({ color, size }) => <Ionicons name="alarm" size={size ?? 24} color={color} />, tabBarAccessibilityLabel: 'Aba 4 de 5: Lembretes' }} />
      <Tabs.Screen name="reports" options={{ title: 'Relatórios', tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size ?? 24} color={color} />, tabBarAccessibilityLabel: 'Aba 5 de 5: Relatórios' }} />
    </Tabs>
  )
}
