import { createMemoryDb } from '../services/db/memory-db'
import { SyncEngine } from '../services/sync/engine'
import { SyncGateway } from '../services/sync/gateway'
import { enqueue } from '../services/sync/outbox'

const offlineGateway: SyncGateway = {
  configured: false,
  async pushUpsert() { return 'applied' },
  async pushSoftDelete() {},
  async pull() { return [] },
  async pullProfile() { return null },
  async upsertProfile() {},
  async deleteAllUserData() {},
}

describe('privacidade do espelho local', () => {
  it('wipeLocal remove perfil, dados, outbox e invalida metadados conhecidos', async () => {
    const db = await createMemoryDb()
    await db.insert('local_profile', { id: 'u1', display_name: 'Paciente Teste' })
    await db.insert('glucose_measurements', { id: 'g1', user_id: 'u1', value: 110 })
    await enqueue(db, 'glucose_measurements', 'g1', 'upsert', { id: 'g1', user_id: 'u1', value: 110 }, '2026-09-10T10:00:00Z')
    await db.setMeta('user_id', 'u1')
    await db.setMeta('dashboard.seen-month', '2026-09')
    await db.setMeta('last_pulled_at.glucose_measurements', '2026-09-10T10:00:00Z')

    const engine = new SyncEngine(db, offlineGateway)
    await engine.wipeLocal()

    expect(await db.select('local_profile')).toHaveLength(0)
    expect(await db.select('glucose_measurements')).toHaveLength(0)
    expect(await db.select('sync_outbox')).toHaveLength(0)
    expect(await db.getMeta('user_id')).toBe('')
    expect(await db.getMeta('dashboard.seen-month')).toBe('')
    expect(await db.getMeta('last_pulled_at.glucose_measurements')).toBe('')
    expect(engine.getStatus()).toMatchObject({ state: 'idle', pending: 0, lastSyncAt: null, error: null })
  })
})
