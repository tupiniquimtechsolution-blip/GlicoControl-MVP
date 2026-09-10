/**
 * Motor de sincronização.
 *  - push: drena outbox em lotes (tabela por vez, ordem de dependência de FK).
 *  - pull: aplica mudanças do servidor mais recentes (LWW), incluindo tombstones.
 *  - mutex por instância; erros não derrubam a UI (fila fica para retry).
 *  - nunca envia conteúdo para log além de nomes/contagens (logger sanitizado).
 */
import { Db, Row } from '../db/types'
import { clearOutbox, dueOps, markDone, markRetry, OutboxEntry, pendingCount } from './outbox'
import { shouldApplyRows } from './pull-apply'
import { SyncGateway } from './gateway'
import { SYNC_TABLES } from './tables'
import { logEvent } from '../observability/log'

export type SyncState = 'idle' | 'running' | 'offline' | 'error'
export type SyncStatus = {
  state: SyncState
  pending: number
  lastSyncAt: string | null
  error: string | null
}

type Listener = (s: SyncStatus) => void

export class SyncEngine {
  private running = false
  private listeners = new Set<Listener>()
  private status: SyncStatus = { state: 'idle', pending: 0, lastSyncAt: null, error: null }

  constructor(private db: Db, private gateway: SyncGateway, private opts: { batch?: number; now?: () => Date } = {}) {}

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    fn(this.status)
    return () => this.listeners.delete(fn)
  }

  getStatus() {
    return this.status
  }

  private setStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch }
    for (const fn of this.listeners) fn(this.status)
  }

  async notifyPending() {
    this.setStatus({ pending: await pendingCount(this.db) })
  }

  /** sincronização completa; retorna false quando offline (sem credenciais ou sem rede) */
  async syncNow(): Promise<boolean> {
    if (!this.gateway.configured) {
      this.setStatus({ state: 'error', error: 'backend-not-configured' })
      await this.refreshPending()
      return false
    }
    if (this.running) return true
    this.running = true
    this.setStatus({ state: 'running', error: null })
    try {
      await this.push()
      await this.pull()
      this.setStatus({ state: 'idle', lastSyncAt: new Date(this.opts.now?.().getTime() ?? Date.now()).toISOString() })
      await this.applyRetention()
      return true
    } catch (e: unknown) {
      const err = e as { message?: string }
      const msg = String(err?.message ?? e)
      const offline = /NetworkError|Failed to fetch|network|not-configured/i.test(msg)
      this.setStatus({ state: offline ? 'offline' : 'error', error: msg.slice(0, 160) })
      logEvent({ name: 'sync.failed', level: 'warn', code: offline ? 'offline' : 'error' })
      return false
    } finally {
      this.running = false
      await this.refreshPending()
    }
  }

  private async refreshPending() {
    this.setStatus({ pending: await pendingCount(this.db) })
  }

  private async push() {
    const batch = this.opts.batch ?? 100
    for (const def of SYNC_TABLES) {
      let ops = await dueOpsFor(this.db, def.name, batch)
      while (ops.length) {
        for (const op of ops) {
          try {
            if (op.op === 'upsert') {
              // LWW: o RPC 0011 usa payload._proposed_updated_at como timestamp proposto do cliente
              const res = await this.gateway.pushUpsert(def.name, { ...op.payload, _proposed_updated_at: op.proposed_updated_at })
              if (res === 'not-found-parent') {
                // pai ainda não sincronizado: mantém na fila p/ novo backoff (push do pai ocorre antes na ordem)
                await markRetry(this.db, op, 'parent-pending')
                continue
              }
            } else {
              await this.gateway.pushSoftDelete(def.name, op.row_id)
            }
            await markDone(this.db, op)
          } catch (e: unknown) {
            const msg = String((e as Error)?.message ?? e)
            if (/NetworkError|Failed to fetch/i.test(msg)) throw e
            await markRetry(this.db, op, msg)
          }
        }
        ops = await dueOpsFor(this.db, def.name, batch)
      }
    }
  }

  private async pull() {
    for (const def of SYNC_TABLES) {
      const since = await this.db.getMeta(`last_pulled_at.${def.name}`)
      const rows = await this.gateway.pull(def.name, since)
      if (!rows.length) continue
      await shouldApplyRows(this.db, def.name, rows)
      const latest = rows.reduce((acc, r) => (String(r.updated_at) > acc ? String(r.updated_at) : acc), since ?? '')
      await this.db.setMeta(`last_pulled_at.${def.name}`, latest)
    }
    const userId = await this.db.getMeta('user_id')
    if (userId) {
      const profile = await this.gateway.pullProfile(userId)
      if (profile) await this.db.upsert('local_profile', { ...profile, onboarding_completed: profile.onboarding_completed ? 1 : 0, row_version: Number(profile.row_version ?? 0) })
    }
  }

  /** tombstones locais com exclusão antiga saem do espelho (retenção de sync = 30 dias) */
  private async applyRetention() {
    const cutoff = new Date((this.opts.now?.() ?? new Date()).getTime() - 30 * 86400_000).toISOString()
    for (const def of SYNC_TABLES) {
      const stale = await this.db.select<Row>(def.name, {
        where: [{ col: 'deleted_at', op: 'notNull' }],
      })
      for (const row of stale) {
        if (String(row.deleted_at) < cutoff) await this.db.deleteById(def.name, String(row.id))
      }
    }
  }

  /**
   * Logout/exclusão local deve remover TODO o estado associado ao usuário do aparelho:
   * dados clínicos, perfil, outbox e cursores/metadados de sincronização.
   */
  async wipeLocal() {
    for (const def of SYNC_TABLES) {
      for (const row of await this.db.select(def.name)) await this.db.deleteById(def.name, String(row.id))
    }
    for (const row of await this.db.select('local_profile')) {
      await this.db.deleteById('local_profile', String(row.id))
    }
    await clearOutbox(this.db)

    // setMeta cobre também o driver em memória usado nos testes/web preview; em SQLite
    // removemos em seguida as linhas persistidas para não deixar identificadores residuais.
    const knownMetaKeys = [
      'user_id',
      'dashboard.seen-month',
      ...SYNC_TABLES.map(def => `last_pulled_at.${def.name}`),
    ]
    for (const key of knownMetaKeys) await this.db.setMeta(key, '')
    for (const row of await this.db.select('sync_meta')) {
      await this.db.deleteById('sync_meta', String(row.key))
    }

    this.setStatus({ state: 'idle', pending: 0, lastSyncAt: null, error: null })
  }
}

async function dueOpsFor(db: Db, table: string, batch: number): Promise<OutboxEntry[]> {
  const all = await dueOps(db, 1000)
  return all.filter(o => o.table_name === table).slice(0, batch)
}
