/** Implementação real do SyncGateway sobre supabase-js. */
import { SupabaseClient } from '@supabase/supabase-js'
import { PullResult, SyncGateway } from '../sync/gateway'
import { Row } from '../db/types'
import { logEvent } from '../observability/log'

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
        // FK violada (filho sem pai no servidor ainda) → marcado no engine como retry
        if (error.code === '23503') return 'not-found-parent'
        if (String(error.message).includes('STALE')) return 'skipped-stale'
        throw error
      }
      const status = (data as { status?: string } | null)?.status
      logEvent({ name: 'sync.push', table, code: status ?? 'ok' })
      return status === 'skipped_stale' ? 'skipped-stale' : 'applied'
    },
    async pushSoftDelete(table, id) {
      const c = guard()
      const { error } = await c.rpc('sync_soft_delete', { p_table: table, p_id: id })
      if (error) throw error
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
