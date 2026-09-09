/** Metas configuradas pelo paciente/profissional — banda exibicional, nunca conselho clínico. */
import { Db, Row, uuidv7 } from '../db/types'
import { enqueue } from '../sync/outbox'
import { GlucoseUnit } from '../../domain/glucose/units'
import { GlucoseContext } from '../../domain/glucose/contexts'

export type Target = { context: 'any' | GlucoseContext; unit: GlucoseUnit; min: number | null; max: number | null; notes: string | null; id: string }

export class TargetRepo {
  constructor(private db: Db, private userId: () => string | null) {}

  async get(context: 'any' | GlucoseContext = 'any'): Promise<Target | null> {
    const rows = await this.db.select<Row>('glucose_targets', {
      where: [{ col: 'context', op: '=', value: context }, { col: 'deleted_at', op: 'isNull' }],
      order: [{ col: 'updated_at', desc: true }],
      limit: 1,
    })
    const r = rows[0]
    if (!r) return null
    return { id: String(r.id), context, unit: r.unit as GlucoseUnit, min: r.min_value == null ? null : Number(r.min_value), max: r.max_value == null ? null : Number(r.max_value), notes: r.notes ? String(r.notes) : null }
  }

  validate(min: number | null, max: number | null): Record<string, string> {
    const errors: Record<string, string> = {}
    if (min != null && max != null && min >= max) errors.max = 'O máximo deve ser maior que o mínimo.'
    for (const v of [min, max]) if (v != null && (v <= 0 || v > 5000)) errors.range = 'Valores fora da faixa aceita pelo app.'
    return errors
  }

  async set(min: number | null, max: number | null, unit: GlucoseUnit, notes: string | null): Promise<Record<string, string>> {
    const errors = this.validate(min, max)
    if (Object.keys(errors).length) return errors
    const userId = this.userId()
    if (!userId) return { auth: 'Faça login.' }
    const existing = await this.get('any')
    const now = new Date().toISOString()
    const payload = { context: 'any', unit, min_value: min, max_value: max, notes }
    if (existing) {
      await this.db.update('glucose_targets', existing.id, { ...payload, updated_at: now, row_version: 0 })
      await enqueue(this.db, 'glucose_targets', existing.id, 'upsert', { id: existing.id, ...payload }, now)
      return {}
    }
    const id = uuidv7()
    await this.db.insert('glucose_targets', { id, user_id: userId, ...payload, created_at: now, updated_at: now, row_version: 1, deleted_at: null })
    await enqueue(this.db, 'glucose_targets', id, 'upsert', { id, ...payload }, now)
    return {}
  }

  async clear(): Promise<void> {
    const t = await this.get('any')
    if (!t) return
    const now = new Date().toISOString()
    await this.db.update('glucose_targets', t.id, { deleted_at: now, updated_at: now })
    await enqueue(this.db, 'glucose_targets', t.id, 'soft_delete', { id: t.id }, now)
  }
}
