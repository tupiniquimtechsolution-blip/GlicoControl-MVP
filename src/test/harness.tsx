/** Harness para testes de tela: memory-db + core real do app + gateway fake em memória. */
import React from 'react'
import { render, RenderAPI } from '@testing-library/react-native'

import { createMemoryDb } from '../services/db/memory-db'
import { AppCoreProvider, AppCore, createAppCore } from '../services/appContext'
import { ThemeProvider } from '../theme/ThemeProvider'
import { ToastProvider } from '../components/Toast'
import { AuthProvider } from '../features/auth/AuthContext'
import { createNotificationScheduler } from '../services/notifications/notificationService'
import { Row } from '../services/db/types'
import { SyncGateway } from '../services/sync/gateway'

export type FakeServer = Map<string, Map<string, Row>>

export function fakeGateway(server: FakeServer, userId: string): SyncGateway {
  return {
    configured: true,
    async pushUpsert(table, payload) {
      if (payload.user_id && String(payload.user_id) !== userId) return 'skipped-stale'
      if (!server.has(table)) server.set(table, new Map())
      server.get(table)!.set(String(payload.id), { ...payload, updated_at: new Date().toISOString(), row_version: 1 } as Row)
      return 'applied'
    },
    async pushSoftDelete(table, id) {
      const row = server.get(table)?.get(id)
      if (row) server.get(table)!.set(id, { ...row, deleted_at: new Date().toISOString() } as Row)
    },
    async pull(table) {
      return [...(server.get(table)?.values() ?? [])]
    },
    async pullProfile() {
      return null
    },
    async upsertProfile() {},
    async deleteAllUserData() {},
  }
}

export async function createHarness(over: { userId?: string } = {}) {
  const db = await createMemoryDb()
  const userId = over.userId ?? `user-${Math.random().toString(36).slice(2, 8)}`
  const server: FakeServer = new Map()
  const core: AppCore = createAppCore(db, {
    gateway: fakeGateway(server, userId),
    notifications: createNotificationScheduler(),
    nativeDb: false,
  })
  core.setUserId(userId)
  await core.profile.save({ id: userId, display_name: 'Paciente Teste', unit: 'mg/dL', onboarding_completed: true })
  await core.profile.setConsent(userId, 'test')
  const Providers = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider>
      <AppCoreProvider core={core}>
        <ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider>
      </AppCoreProvider>
    </ThemeProvider>
  )
  const renderApp = (ui: React.ReactElement): RenderAPI => render(<Providers>{ui}</Providers>)
  return { db, core, server, renderApp, userId }
}