/** Aplica linhas puxadas do servidor no espelho local com LWW + normalização para o formato local. */
import { Db, fromBool, Row, TableName } from '../db/types'
import { shouldApplyPull } from './lww'

const BOOL_FIELDS = ['enabled', 'active', 'onboarding_completed']
const JSON_FIELDS: Partial<Record<TableName, string[]>> = {
  reminders: ['days_of_week'],
  medication_schedules: ['days_of_week'],
}

/** servidor (Postgres: boolean, arrays) → espelho local (SQLite: 0/1, JSON string) */
export function normalizeLocal(table: TableName, row: Row): Row {
  const out: Row = { ...row }
  for (const f of BOOL_FIELDS) if (f in out) out[f] = fromBool(out[f] === true || out[f] === 1 || out[f] === 't' || out[f] === '1')
  for (const f of JSON_FIELDS[table] ?? []) if (Array.isArray(out[f])) out[f] = JSON.stringify(out[f])
  if (out.value != null) out.value = Number(out.value)
  if (out.snooze_minutes != null) out.snooze_minutes = Number(out.snooze_minutes)
  if (out.position != null) out.position = Number(out.position)
  if (out.row_version != null) out.row_version = Number(out.row_version)
  if (out.min_value != null) out.min_value = Number(out.min_value)
  if (out.max_value != null) out.max_value = Number(out.max_value)
  return out
}

export async function shouldApplyRows(db: Db, table: TableName, rows: Row[]): Promise<number> {
  let applied = 0
  for (const raw of rows) {
    const remote = normalizeLocal(table, raw)
    const [local] = await db.select<Row>(table, { where: [{ col: 'id', op: '=', value: String(remote.id) }] })
    const apply = shouldApplyPull(
      local
        ? { updated_at: String(local.updated_at), row_version: Number(local.row_version) }
        : null,
      { updated_at: String(remote.updated_at), row_version: Number(remote.row_version ?? 0) }
    )
    if (!apply) continue
    if (remote.deleted_at) {
      await db.deleteById(table, String(remote.id))
    } else {
      await db.upsert(table, remote)
    }
    applied++
  }
  return applied
}
