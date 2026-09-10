import { Stack } from 'expo-router'
import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AppProviders } from '../services/appContext'
import { AuthProvider } from '../features/auth/AuthContext'
import { ThemeProvider } from '../theme/ThemeProvider'
import { ToastProvider } from '../components/Toast'
import { handleNotificationResponse } from '../services/notifications/notificationService'
import { useApp } from '../services/appContext'
import { router } from 'expo-router'

function NotificationResponses() {
  const app = useApp()
  useEffect(() => {
    let sub: { remove: () => void } | null = null
    void (async () => {
      try {
        const N = require('expo-notifications')
        sub = N.addNotificationResponseReceivedListener((response: never) =>
          handleNotificationResponse(response, {
            onRegisterNow: () => router.push('/(app)/register'),
            onSnooze: (refId: string, minutes: number) => {
              void app.notifications.snooze(refId, minutes)
            },
            onMarkDone: () => router.push('/(app)/register'),
            onMedicationAction: (medicationId: string, action: 'taken' | 'snoozed' | 'skipped') => {
              void app.medications.logAction(medicationId, null, action).then(() => app.bump())
            },
          })
        )
      } catch {
        /* sem módulo nativo (web/Go): ações via telas continuam funcionando */
      }
    })()
    return () => sub?.remove()
  }, [app])
  return null
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProviders>
            <AuthProvider>
              <ToastProvider>
                <NotificationResponses />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(app)" />
                  <Stack.Screen name="day/[date]" options={{ presentation: 'card', headerShown: false }} />
                  <Stack.Screen name="reminders-edit" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="reports/[month]" options={{ headerShown: false }} />
                  <Stack.Screen name="history" options={{ headerShown: false }} />
                  <Stack.Screen name="medications" options={{ headerShown: false }} />
                  <Stack.Screen name="settings" options={{ headerShown: false }} />
                </Stack>
              </ToastProvider>
            </AuthProvider>
          </AppProviders>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}