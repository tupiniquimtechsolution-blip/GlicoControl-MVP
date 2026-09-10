/** Implementação real do SyncGateway sobre supabase-js. */
import { SupabaseClient } from '@supabase/supabase-js'
import { PullResult, SyncGateway } from '../sync/gateway'
import { Row } from '../db/types'
import { logEvent } from '../observability/log'

export type SyncUpsertStatus = 'applied' | 'skipped-stale' | 'not-found-parent'

/**
 * A RPC `sync_upsert_row` retorna TEXT no Postgres. Mantemos a tradução explícita
 * para que conflitos LWW, pais ausentes e payloads inválidos nunca sejam tratados
 * silenciosamente como sucesso.
 */
export function mapSyncUpsertStatus(data: unknown): SyncUpsertStatus {
  if (data === 'applied') return 'applied'
  if (data === 'skipped-stale') return 'skipped-stale'
  if (data === 'parent-missing') return 'not-found-parent'

  const code = typeof data === 'string' ? data : 'invalid-rpc-response'
  throw new Error(`sync-upsert-unexpected-status:${code}`)
}

export function createSupabaseGateway(client: SupabaseClient | null): SyncGateway {
  const configured = !!client
  const guard = () => {
    if (!client) throw new Error('supabase-not-configured')
    return client
  }
  return {
    configured,
    async pushUpsert(table, payload) {
      const c = guard()
      const { data, error } = await c.rpc('sync_upsert_row', {
        p_table: table,
        p_payload: payload,
      })
      if (error) {
        // Compatibilidade defensiva caso o Postgres devolva FK como erro bruto.
        if (error.code === '23503') return 'not-found-parent'
        throw error
      }
      const status = mapSyncUpsertStatus(data)
      logEvent({ name: 'sync.push', table, code: status })
      return status
    },
    async pushSoftDelete(table, id) {
      const c = guard()
      const { data, error } = await c.rpc('sync_soft_delete', { p_table: table, p_id: id })
      if (error) throw error
      if (data !== 'applied' && data !== 'not-found') {
        throw new Error(`sync-delete-unexpected-status:${String(data)}`)
      }
    },
    async pull(table, since) {
      const c = guard()
      let query = c.from(table).select('*').order('updated_at', { ascending: true })
      if (since) query = query.gt('updated_at', since)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Row[]
    },
    async pullProfile(userId) {
      const c = guard()
      const { data, error } = await c.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (error) throw error
      return (data as Row | null) ?? null
    },
    async upsertProfile(userId, patch) {
      const c = guard()
      const { error } = await c.from('profiles').upsert({ id: userId, ...patch })
      if (error) throw error
    },
    async deleteAllUserData() {
      const c = guard()
      const { error } = await c.rpc('delete_own_data')
      if (error) throw error
    },
  }
}

export type { PullResult }
