/**
 * Composição da aplicação (camada services → features). Telas acessam tudo por aqui;
 * nenhuma tela conhece Supabase/SQLite diretamente.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'

import { Db } from './db/types'
import { openAppDb } from './db/sqlite-driver'
import { SyncEngine } from './sync/engine'
import { SyncGateway } from './sync/gateway'
import { createSupabaseGateway } from './supabase/gateway-impl'
import { getSupabase } from './supabase/client'
import { isSupabaseConfigured } from './supabase/config'
import { MeasurementRepo } from './repositories/measurementRepo'
import { ReminderRepo } from './repositories/reminderRepo'
import { MedicationRepo } from './repositories/medicationRepo'
import { TargetRepo } from './repositories/targetRepo'
import { ProfileRepo } from './repositories/profileRepo'
import { createNotificationScheduler, NotifScheduler } from './notifications/notificationService'
import { pendingCount } from './sync/outbox'

export type AppServices = {
  db: Db
  nativeDb: boolean
  gateway: SyncGateway
  sync: SyncEngine
  notifications: NotifScheduler
  measurements: MeasurementRepo
  reminders: ReminderRepo
  medications: MedicationRepo
  targets: TargetRepo
  profile: ProfileRepo
  backendConfigured: boolean
  /** versão incremental que muda a cada escrita local — telas reconsultam sem polling */
  revision: number
  bump: () => void
  setUserId: (id: string | null) => void
}

const Ctx = createContext<AppServices | null>(null)

type Ready = Omit<AppServices, 'revision' | 'bump' | 'setUserId'>

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState<Ready | null>(null)
  const [revision, setRevision] = useState(0)
  const userIdRef = useRef<string | null>(null)
  const engineRef = useRef<SyncEngine | null>(null)

  useEffect(() => {
    let mounted = true
    void (async () => {
      const { db, native } = await openAppDb()
      const userId = () => userIdRef.current
      const gateway = createSupabaseGateway(getSupabase())
      const sync = new SyncEngine(db, gateway)
      engineRef.current = sync
      const notifications = createNotificationScheduler()
      const services: Ready = {
        db,
        nativeDb: native,
        gateway,
        sync,
        notifications,
        measurements: new MeasurementRepo(db, userId),
        reminders: new ReminderRepo(db, userId),
        medications: new MedicationRepo(db, userId),
        targets: new TargetRepo(db, userId),
        profile: new ProfileRepo(db),
        backendConfigured: isSupabaseConfigured(),
      }
      if (mounted) setReady(services)
    })()
    return () => {
      mounted = false
    }
  }, [])

  // sincroniza em: foco do app, mudança de estado para "active" e após escritas locais
  useEffect(() => {
    if (!ready) return
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void ready.sync.syncNow().then(() => setRevision(r => r + 1))
    })
    void ready.sync.syncNow().then(() => setRevision(r => r + 1))
    return () => sub.remove()
  }, [ready])

  const bump = useCallback(async () => {
    setRevision(r => r + 1)
    void ready?.sync.notifyPending()
    if (ready?.gateway.configured) void ready.sync.syncNow().then(() => setRevision(r => r + 1))
  }, [ready])

  const setUserId = useCallback(
    (id: string | null) => {
      userIdRef.current = id
      if (ready) void ready.db.setMeta('user_id', id ?? '')
    },
    [ready]
  )

  const value = useMemo(() => (ready ? { ...ready, revision, bump, setUserId } : null), [ready, revision, bump, setUserId])
  if (!value) return <AppLoadingFallback>{children}</AppLoadingFallback>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

import { View, Text, ActivityIndicator } from 'react-native'
export function AppLoadingFallback({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
      <Text>Carregando dados locais…</Text>
      {children}
    </View>
  )
}

export function useApp(): AppServices {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp requer <AppProviders> (e banco inicializado)')
  return ctx
}

/** hook de "reconsultar quando dados locais mudam" */
export function useRevisionDeps<T>(factory: (revision: number) => T, extraDeps: React.DependencyList = []): { value: T; reload: () => void } {
  const { revision, bump } = useApp()
  const value = useMemo(() => factory(revision), [revision, ...extraDeps])
  return { value, reload: bump }
}

export async function localPending(db: Db) {
  return pendingCount(db)
}
