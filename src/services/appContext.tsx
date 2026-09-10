/**
 * Composição da aplicação (services → features). Telas acessam tudo por aqui;
 * nenhuma tela conhece Supabase/SQLite diretamente.
 * `createAppCore` é pura (injetável em testes); o provider só adiciona estado de UI (revision).
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppState } from 'react-native'

import { Db } from './db/types'
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

export type AppCore = {
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
  setUserId: (id: string | null) => void
  currentUserId: () => string | null
}

export function createAppCore(db: Db, opts: { gateway?: SyncGateway; notifications?: NotifScheduler; nativeDb?: boolean } = {}): AppCore {
  const userIdRef = { current: null as string | null }
  const gateway = opts.gateway ?? createSupabaseGateway(getSupabase())
  const sync = new SyncEngine(db, gateway)
  const userId = () => userIdRef.current
  return {
    db,
    nativeDb: opts.nativeDb ?? false,
    gateway,
    sync,
    notifications: opts.notifications ?? createNotificationScheduler(),
    measurements: new MeasurementRepo(db, userId),
    reminders: new ReminderRepo(db, userId),
    medications: new MedicationRepo(db, userId),
    targets: new TargetRepo(db, userId),
    profile: new ProfileRepo(db),
    backendConfigured: isSupabaseConfigured(),
    setUserId: (id: string | null) => {
      userIdRef.current = id
      void db.setMeta('user_id', id ?? '')
    },
    currentUserId: () => userIdRef.current,
  }
}

export type AppServices = AppCore & {
  revision: number
  bump: () => void
}

type ChangeFn = () => void

export function AppCoreProvider({ core, children }: { core: AppCore; children: React.ReactNode }) {
  const [revision, setRevision] = useState(0)
  const listeners = useRef(new Set<ChangeFn>())
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      listeners.current.clear()
    }
  }, [])

  const bump = useCallback(() => {
    if (mounted.current) setRevision(r => r + 1)
    void core.sync.notifyPending()
    if (core.gateway.configured) {
      void core.sync.syncNow().then(() => {
        if (mounted.current) setRevision(r => r + 1)
      })
    }
    for (const fn of listeners.current) fn()
  }, [core])

  useEffect(() => {
    let active = true
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void core.sync.syncNow().then(() => {
          if (active && mounted.current) setRevision(r => r + 1)
        })
      }
    })
    void core.sync.syncNow().then(() => {
      if (active && mounted.current) setRevision(r => r + 1)
    })
    return () => {
      active = false
      sub.remove()
    }
  }, [core])

  const value = useMemo<AppServices>(() => ({ ...core, revision, bump }), [core, revision, bump])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const Ctx = createContext<AppServices | null>(null)

/** Provider raiz do app: abre o banco (SQLite no aparelho; memória em web preview/testes). */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [core, setCore] = useState<AppCore | null>(null)
  useEffect(() => {
    let mounted = true
    void (async () => {
      const { openAppDb } = await import('./db/sqlite-driver')
      const { db, native } = await openAppDb()
      const c = createAppCore(db, { nativeDb: native })
      void db.getMeta('user_id').then(u => u && c.setUserId(u))
      if (mounted) setCore(c)
    })()
    return () => {
      mounted = false
    }
  }, [])
  if (!core) return null
  return <AppCoreProvider core={core}>{children}</AppCoreProvider>
}

export function useApp(): AppServices {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp requer <AppProviders> (e banco inicializado)')
  return ctx
}

export async function localPending(db: Db) {
  return pendingCount(db)
}
