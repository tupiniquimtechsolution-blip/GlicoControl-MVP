/** Repositório de medições — única porta de escrita/leitura do domínio glicêmico na UI.
 *  Local-first: lê/escreve no espelho; enfileira no outbox; sincronização é transparente. */
import { Db, Row, uuidv7 } from '../db/types'
import { enqueue } from '../sync/outbox'
import { GlucoseContext } from '../../domain/glucose/contexts'
import { GlucoseMeasurement, MeasurementDraft } from '../../domain/glucose/types'
import { GlucoseUnit } from '../../domain/glucose/units'
import { localToIso, minuteKey, todayYmd } from '../../domain/dates/month'
import { validateDraft } from '../../domain/glucose/validation'

export type NewMeasurement = {
  value: number
  unit: GlucoseUnit
  localDate: string
  localTime: string
  context: GlucoseContext
  note: string | null
}

function serverPayload(row: Row): Row {
  // formato do servidor: booleans nativos e null preservados; updated_at local é a PROPOSTA p/ LWW
  return {
    id: row.id,
    value: row.value,
    unit: row.unit,
    measured_at: row.measured_at,
    local_date: row.local_date,
    local_time: row.local_time,
    tz_name: row.tz_name,
    context: row.context,
    note: row.note ?? null,
  }
}

export class MeasurementRepo {
  constructor(private db: Db, private userId: () => string | null) {}

  private tzName(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  }

  async listByRange(from: string, to: string): Promise<GlucoseMeasurement[]> {
    const rows = await this.db.select<GlucoseMeasurement>('glucose_measurements', {
      where: [
        { col: 'local_date', op: '>=', value: from },
        { col: 'local_date', op: '<=', value: to },
      ],
      order: [{ col: 'local_date', desc: true }, { col: 'local_time', desc: true }],
    })
    return rows.filter(r => r.deleted_at == null).map(r => ({ ...r, value: Number(r.value) }))
  }

  async listByDay(date: string): Promise<GlucoseMeasurement[]> {
    const rows = await this.db.select<GlucoseMeasurement>('glucose_measurements', {
      where: [
        { col: 'local_date', op: '=', value: date },
        { col: 'deleted_at', op: 'isNull' },
      ],
      order: [{ col: 'local_time' }],
    })
    return rows.map(r => ({ ...r, value: Number(r.value) }))
  }

  /** contagens por dia para o calendário: date -> n */
  async dayCounts(monthKey: string): Promise<Record<string, number>> {
    const rows = await this.db.select<Row>('glucose_measurements', {
      where: [
        { col: 'local_date', op: '>=', value: `${monthKey}-01` },
        { col: 'local_date', op: '<=', value: `${monthKey}-31` },
        { col: 'deleted_at', op: 'isNull' },
      ],
    })
    const out: Record<string, number> = {}
    for (const r of rows) out[String(r.local_date)] = (out[String(r.local_date)] ?? 0) + 1
    return out
  }

  async get(id: string): Promise<GlucoseMeasurement | null> {
    const rows = await this.db.select<GlucoseMeasurement>('glucose_measurements', {
      where: [{ col: 'id', op: '=', value: id }, { col: 'deleted_at', op: 'isNull' }],
      limit: 1,
    })
    return rows[0] ? { ...rows[0], value: Number(rows[0].value) } : null
  }

  /** dedupe por minuto+contexto: mesmo minute-key & contexto => linha existente (sobrescreve valor) */
  private async findDuplicate(date: string, time: string, context: string, excludeId?: string): Promise<GlucoseMeasurement | null> {
    const mk = minuteKey(date, time)
    const same = (await this.db.select<Row>('glucose_measurements', {
      where: [{ col: 'local_date', op: '=', value: date }, { col: 'deleted_at', op: 'isNull' }],
    })).find(r => r.context === context && minuteKey(String(r.local_date), String(r.local_time)) === mk && String(r.id) !== excludeId)
    return (same as GlucoseMeasurement) ?? null
  }

  /** cria; retorna id (reuso em caso de duplicata por minuto/contexto = anti-duplo-clique no servidor) */
  async create(draft: MeasurementDraft): Promise<{ id: string; merged: boolean; errors: Record<string, string> }> {
    const errors = validateDraft(draft)
    if (Object.keys(errors).length) return { id: '', merged: false, errors }
    const userId = this.userId()
    if (!userId) return { id: '', merged: false, errors: { auth: 'Faça login para registrar.' } }
    const v = Number(String(draft.valueText).replace(',', '.'))
    const value = draft.unit === 'mg/dL' ? Math.round(v) : Math.round(v * 10) / 10
    const localTime = draft.localTime.length === 5 ? `${draft.localTime}:00` : draft.localTime
    const dup = await this.findDuplicate(draft.localDate, localTime, draft.context)
    const now = new Date().toISOString()
    const base: Row = {
      user_id: userId,
      value,
      unit: draft.unit,
      measured_at: localToIso(draft.localDate, localTime),
      local_date: draft.localDate,
      local_time: localTime,
      tz_name: this.tzName(),
      context: draft.context,
      note: draft.note ? draft.note.slice(0, 500) : null,
      updated_at: now,
      row_version: dup ? Number(dup.row_version) + 1 : 1,
      deleted_at: null,
    }
    if (dup) {
      await this.db.update('glucose_measurements', String(dup.id), base)
      const merged = await this.db.select<Row>('glucose_measurements', { where: [{ col: 'id', op: '=', value: String(dup.id) }], limit: 1 })
      await enqueue(this.db, 'glucose_measurements', String(dup.id), 'upsert', serverPayload(merged[0]), now)
      return { id: String(dup.id), merged: true, errors: {} }
    }
    const id = uuidv7()
    await this.db.insert('glucose_measurements', { id, created_at: now, ...base })
    await enqueue(this.db, 'glucose_measurements', id, 'upsert', serverPayload({ id, ...base }), now)
    return { id, merged: false, errors: {} }
  }

  async update(id: string, patch: Partial<NewMeasurement>): Promise<Record<string, string>> {
    const existing = await this.get(id)
    if (!existing) return { notfound: 'Medição não encontrada.' }
    const draft: MeasurementDraft = {
      valueText: String(patch.value ?? existing.value),
      unit: patch.unit ?? existing.unit,
      localDate: patch.localDate ?? existing.local_date,
      localTime: patch.localTime ?? existing.local_time.slice(0, 5),
      context: patch.context ?? existing.context,
      note: patch.note ?? existing.note ?? '',
    }
    const errors = validateDraft(draft)
    if (Object.keys(errors).length) return errors
    const now = new Date().toISOString()
    const next: Row = {
      value: Number(draft.valueText) as never,
      unit: draft.unit,
      measured_at: localToIso(draft.localDate, draft.localTime.length === 5 ? `${draft.localTime}:00` : draft.localTime),
      local_date: draft.localDate,
      local_time: draft.localTime.length === 5 ? `${draft.localTime}:00` : draft.localTime,
      context: draft.context,
      note: draft.note ? draft.note.slice(0, 500) : null,
      updated_at: now,
      row_version: Number(existing.row_version) + 1,
    }
    await this.db.update('glucose_measurements', id, next)
    const merged = await this.db.select<Row>('glucose_measurements', { where: [{ col: 'id', op: '=', value: id }], limit: 1 })
    await enqueue(this.db, 'glucose_measurements', id, 'upsert', serverPayload(merged[0]), now)
    return {}
  }

  /** soft delete (sync apaga com tombstone; confirmação é na UI) */
  async softDelete(id: string): Promise<void> {
    const existing = await this.get(id)
    if (!existing) return
    const now = new Date().toISOString()
    await this.db.update('glucose_measurements', id, { deleted_at: now, updated_at: now, row_version: Number(existing.row_version) + 1 })
    await enqueue(this.db, 'glucose_measurements', id, 'soft_delete', { id }, now)
  }

  async last(): Promise<GlucoseMeasurement | null> {
    const rows = await this.listByRange(
      `${new Date().getFullYear() - 1}-01-01`,
      '9999-12-31'
    )
    return rows[0] ?? null
  }

  async todaySummary(unit: GlucoseUnit) {
    const rows = await this.listByDay(todayYmd())
    const vs = rows.map(r => Number(r.value))
    return { count: rows.length, min: vs.length ? Math.min(...vs) : null, max: vs.length ? Math.max(...vs) : null, unit }
  }
}
