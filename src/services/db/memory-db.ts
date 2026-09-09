/** Driver em memória: web preview e testes de lógica. Mesma semântica de `select/upsert/...`
 *  do driver SQLite; persistência local no aparelho é sempre SQLite (nunca este driver). */
import { LOCAL_SCHEMA } from './schema'
import { REGISTRY } from './registry'
import { Db, QueryOpts, Row, TableName } from './types'

export async function createMemoryDb(): Promise<Db> {
  const tables = new Map<TableName, Map<string, Row>>()
  for (const t of Object.keys(REGISTRY) as TableName[]) tables.set(t, new Map())
  const meta = new Map<string, string>()
  const rowsOf = (t: TableName) => tables.get(t)!
  const pkOf = (t: TableName) => REGISTRY[t].pk
  const match = (row: Row, opts?: QueryOpts) =>
    (opts?.where ?? []).every(c => {
      const v = row[c.col]
      if (c.op === 'isNull') return v === null || v === undefined
      if (c.op === 'notNull') return v !== null && v !== undefined
      const ref = c.value
      if (ref === undefined || v === undefined || v === null) return false
      switch (c.op) {
        case '=': return String(v) === String(ref)
        case '!=': return String(v) !== String(ref)
        case '>=': return v >= (ref as never)
        case '<=': return v <= (ref as never)
        default: return false
      }
    })
  const db: Db = {
    async select<T extends Row>(t: TableName, opts?: QueryOpts): Promise<T[]> {
      let out = [...rowsOf(t).values()].filter(r => match(r, opts) && (opts?.where ?? []).length >= 0)
      if (opts?.order?.length) {
        out = out.sort((a, b) => {
          for (const o of opts.order!) {
            const cmp = String(a[o.col] ?? '').localeCompare(String(b[o.col] ?? ''))
            if (cmp !== 0) return o.desc ? -cmp : cmp
          }
          return 0
        })
      }
      if (opts?.limit) out = out.slice(0, opts.limit)
      return out.map(r => ({ ...r })) as T[]
    },
    async insert(t: TableName, row: Row) {
      const id = String(row[pkOf(t)])
      if (rowsOf(t).has(id)) throw new Error(`duplicate ${t} ${id}`)
      rowsOf(t).set(id, { ...row })
    },
    async upsert(t: TableName, row: Row) {
      rowsOf(t).set(String(row[pkOf(t)]), { ...row })
    },
    async update(t: TableName, id: string, patch: Row) {
      const existing = rowsOf(t).get(id)
      if (existing) rowsOf(t).set(id, { ...existing, ...patch })
    },
    async deleteById(t: TableName, id: string) {
      rowsOf(t).delete(id)
    },
    async getMeta(key) {
      return meta.get(key) ?? null
    },
    async setMeta(key, value) {
      meta.set(key, value)
    },
    async close() {},
  }
  await db.select('sync_outbox') // no-op: garante tabelas inicializadas
  void LOCAL_SCHEMA
  return db
}
