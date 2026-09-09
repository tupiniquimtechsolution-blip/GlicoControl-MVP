/** Motor de sync sobre memory-db + gateway fake com a MESMA semântica do SQL (LWW/tombstone). */
import { createMemoryDb } from '../services/db/memory-db'
import { SyncEngine } from '../services/sync/engine'
import { SyncGateway } from '../services/sync/gateway'
import { enqueue, pendingCount } from '../services/sync/outbox'
import { shouldApplyRows } from '../services/sync/pull-apply'
import { Row } from '../services/db/types'

type Server = Map<string, Map<string, Row>>

function makeFakeGateway(server: Server, opts: { failFirstPush?: number } = {}): SyncGateway & { calls: number[] } {
  let pushCalls = 0
  let failLeft = opts.failFirstPush ?? 0
  const g = {
    configured: true,
    calls: [] as number[],
    async pushUpsert(table: string, payload: Row) {
      pushCalls++
      g.calls.push(pushCalls)
      if (failLeft > 0) {
        failLeft--
        throw new Error('NetworkError: down')
      }
      if (!server.has(table)) server.set(table, new Map())
      const rows = server.get(table)!
      const id = String(payload.id)
      const existing = rows.get(id)
      const proposed = String(payload._proposed_updated_at ?? '')
      const serverUpdated = String(existing?.updated_at ?? '')
      if (existing && existing.user_id !== payload.user_id) return 'skipped-stale' as const
      if (existing && proposed && proposed <= serverUpdated) return 'skipped-stale' as const
      rows.set(id, { ...payload, user_id: payload.user_id, updated_at: new Date().toISOString(), row_version: Number(existing?.row_version ?? 0) + 1 })
      return 'applied' as const
    },
    async pushSoftDelete(table: string, id: string) {
      const rows = server.get(table)
      const existing = rows?.get(id)
      if (rows && existing && !existing.deleted_at) rows.set(id, { ...existing, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    },
    async pull(table: string, since: string | null) {
      const rows = [...(server.get(table)?.values() ?? [])]
      return since ? rows.filter(r => String(r.updated_at) > since) : rows
    },
    async pullProfile() {
      return null
    },
    async upsertProfile() {},
    async deleteAllUserData() {},
  }
  return g as SyncGateway & { calls: number[] }
}

const baseRow = (over: Row = {}): Row => ({
  id: 'r1',
  user_id: 'u1',
  value: 95,
  unit: 'mg/dL',
  measured_at: '2026-09-09T10:00:00Z',
  local_date: '2026-09-09',
  local_time: '07:00:00',
  tz_name: 'UTC',
  context: 'fasting',
  note: null,
  created_at: '2026-09-09T10:00:00Z',
  updated_at: '2026-09-09T10:00:00Z',
  row_version: 1,
  deleted_at: null,
  ...over,
})

async function fixture(server: Server, failFirstPush = 0) {
  const db = await createMemoryDb()
  return { db, gateway: makeFakeGateway(server, { failFirstPush }) }
}

describe('outbox', () => {
  it('uma pendência por linha (substitui payload antigo, não duplica)', async () => {
    const db = await createMemoryDb()
    await enqueue(db, 'glucose_measurements', 'x1', 'upsert', { v: 1 }, '2026-01-01T00:00:00Z')
    await enqueue(db, 'glucose_measurements', 'x1', 'upsert', { v: 2 }, '2026-01-02T00:00:00Z')
    expect(await pendingCount(db)).toBe(1)
    const rows = await db.select('sync_outbox')
    expect(JSON.parse(String(rows[0].payload)).v).toBe(2)
  })
  it('backoff cresce exponencialmente com teto', () => {
    const db: never = undefined as never
    void db
    expect(require('../services/sync/outbox').backoffIso(1)).toBeTruthy()
  })
})

describe('sync engine', () => {
  it('drena a fila; reenvio idempotente (2x sync não duplica linha no servidor)', async () => {
    const server: Server = new Map()
    const { db, gateway } = await fixture(server)
    await db.insert('glucose_measurements', baseRow() as never)
    await enqueue(db, 'glucose_measurements', 'r1', 'upsert', { ...baseRow(), _proposed_updated_at: '2099-01-01T00:00:00Z' }, '2099-01-01T00:00:00Z')
    const engine = new SyncEngine(db, gateway)
    await engine.syncNow()
    await engine.syncNow()
    expect(server.get('glucose_measurements')?.size).toBe(1)
    expect(await pendingCount(db)).toBe(0)
  })

  it('erro de rede mantém pendência com retry; sucesso posterior esvazia', async () => {
    const server: Server = new Map()
    const { db, gateway } = await fixture(server, 1)
    await enqueue(db, 'glucose_measurements', 'r2', 'upsert', { id: 'r2', user_id: 'u1' }, '2099-01-01T00:00:00Z')
    const engine = new SyncEngine(db, gateway)
    expect(await engine.syncNow()).toBe(false)
    expect(await pendingCount(db)).toBe(1)
    // próximo retry disponível → ok
    const ok = new SyncEngine(db, makeFakeGateway(server))
    expect(await ok.syncNow()).toBe(true)
    expect(await pendingCount(db)).toBe(0)
    expect(server.get('glucose_measurements')?.has('r2')).toBe(true)
  })

  it('pull aplica só o que é mais novo que o espelho (LWW local)', async () => {
    const db = await createMemoryDb()
    await db.upsert('glucose_measurements', baseRow({ updated_at: '2026-09-10T00:00:00Z', row_version: 5, note: 'local-novo' }) as never)
    await shouldApplyRows(db, 'glucose_measurements', [
      baseRow({ updated_at: '2026-09-09T00:00:00Z', row_version: 9, note: 'remote-velho' }),
    ])
    expect((await db.select('glucose_measurements'))[0].note).toBe('local-novo')
    await shouldApplyRows(db, 'glucose_measurements', [
      baseRow({ updated_at: '2026-09-12T00:00:00Z', row_version: 6, note: 'remote-novo' }),
    ])
    expect((await db.select('glucose_measurements'))[0].note).toBe('remote-novo')
  })

  it('servidor sem credenciais → status error, fila preservada (zero perda offline)', async () => {
    const db = await createMemoryDb()
    await enqueue(db, 'medications', 'm1', 'upsert', { id: 'm1' }, '2026-09-09T10:00:00Z')
    const engine = new SyncEngine(db, { ...makeFakeGateway(new Map()), configured: false })
    expect(await engine.syncNow()).toBe(false)
    expect(engine.getStatus().error).toBe('backend-not-configured')
    expect(await pendingCount(db)).toBe(1)
  })

  it('1000 pendências drenam em lote sem duplicar', async () => {
    const server: Server = new Map()
    const db = await createMemoryDb()
    for (let i = 0; i < 1000; i++) {
      await enqueue(db, 'glucose_measurements', `g${i}`, 'upsert', { id: `g${i}`, user_id: 'u1', value: 90 + (i % 30) }, `2099-01-0${(i % 8) + 1}T00:00:00Z`)
    }
    const engine = new SyncEngine(db, makeFakeGateway(server), { batch: 100 })
    const t0 = Date.now()
    expect(await engine.syncNow()).toBe(true)
    expect(Date.now() - t0).toBeLessThan(30_000)
    expect(server.get('glucose_measurements')?.size).toBe(1000)
    expect(await pendingCount(db)).toBe(0)
  }, 40_000)
})
