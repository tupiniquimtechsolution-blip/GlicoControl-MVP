/**
 * Gateway de acesso ao servidor. A implementação real usa supabase-js (PostgREST + RPC);
 * testes injetam uma implementação fake com a MESMA semântica documentada.
 * Regras de servidor (LWW/owner) vivem em SQL: `supabase/migrations/0011_sync_rpc.sql`
 * — testadas com Postgres (PGlite). Este gateway só transporta.
 */
import { Row } from '../db/types'

export type PullResult = { rows: Row[]; latest: string | null }

export interface SyncGateway {
  configured: boolean
  /** upsert com LWW (servidor decide) — idempotente por PK */
  pushUpsert(table: string, payload: Row): Promise<'applied' | 'skipped-stale' | 'not-found-parent'>
  pushSoftDelete(table: string, id: string): Promise<void>
  /** linhas com updated_at > since (ou todas, quando null), incluindo tombstones */
  pull(table: string, since: string | null): Promise<Row[]>
  pullProfile(userId: string): Promise<Row | null>
  upsertProfile(userId: string, patch: Row): Promise<void>
  deleteAllUserData(): Promise<void>
}
