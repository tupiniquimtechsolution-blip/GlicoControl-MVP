/** Fila de saída (outbox): 1 pendência por linha (substituição = last-write local), retries com backoff. */
import { Db, Row, TableName } from '../db/types'

export type OutboxOp = 'upsert' | 'soft_delete'
export type OutboxEntry = {
  seq: string
  table_name: TableName
  row_id: string
  op: OutboxOp
  payload: Row
  proposed_updated_at: string
  attempts: number
  next_retry_at: string
  last_error: string | null
  created_at: string
}

let counter = 0
function nextSeq(now = Date.now()): string {
  counter = (counter + 1) % 100000
  return `${String(now).padStart(14, '0')}-${String(counter).padStart(5, '0')}`
}

export const RETRY_BASE_SECONDS = 5

export function backoffIso(attempts: number, nowMs = Date.now()): string {
  const seconds = Math.min(RETRY_BASE_SECONDS * Math.pow(2, Math.max(0, attempts - 1)), 600)
  const jitter = (nowMs % 1000) / 1000
  return new Date(nowMs + (seconds + jitter) * 1000).toISOString()
}

export async function enqueue(
  db: Db,
  table: TableName,
  rowId: string,
  op: OutboxOp,
  payload: Row,
  proposedUpdatedAt: string,
  nowIso = new Date().toISOString()
): Promise<void> {
  const pending = await db.select<Row>('sync_outbox', {
    where: [
      { col: 'table_name', op: '=', value: table },
      { col: 'row_id', op: '=', value: rowId },
    ],
  })
  const seq = nextSeq()
  const entry = {
    seq,
    table_name: table,
    row_id: rowId,
    op,
    payload: JSON.stringify(payload),
    proposed_updated_at: proposedUpdatedAt,
    attempts: 0,
    next_retry_at: nowIso,
    last_error: null,
    created_at: nowIso,
  }
  if (pending.length) {
    // substitui a pendência anterior pela mais recente (fila por linha; nunca duas linhas para o mesmo id)
    await db.update('sync_outbox', String(pending[0].seq), { ...entry, seq: pending[0].seq })
  } else {
    await db.insert('sync_outbox', entry)
  }
}

export async function dueOps(db: Db, limit: number, nowIso = new Date().toISOString()): Promise<OutboxEntry[]> {
  const rows = await db.select<Row & { payload: string }>('sync_outbox', {
    order: [{ col: 'seq' }],
    limit,
  })
  return rows
    .filter(r => r.next_retry_at <= nowIso)
    .map(r => ({ ...r, op: r.op as OutboxOp, payload: JSON.parse(r.payload) as Row, attempts: Number(r.attempts) }) as unknown as OutboxEntry)
}

export async function markDone(db: Db, entry: OutboxEntry) {
  await db.deleteById('sync_outbox', entry.seq)
}

export async function markRetry(db: Db, entry: OutboxEntry, error: string, nowMs = Date.now()) {
  await db.update('sync_outbox', entry.seq, {
    attempts: entry.attempts + 1,
    next_retry_at: backoffIso(entry.attempts + 1, nowMs),
    last_error: error.slice(0, 200),
  })
}

export async function pendingCount(db: Db): Promise<number> {
  return (await db.select('sync_outbox')).length
}

export async function clearOutbox(db: Db): Promise<void> {
  for (const row of await db.select('sync_outbox')) await db.deleteById('sync_outbox', String(row.seq))
}
