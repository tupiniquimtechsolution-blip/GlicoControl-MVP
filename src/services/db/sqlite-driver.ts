/** Driver SQLite (produção no aparelho) sobre expo-sqlite. */
import { LOCAL_SCHEMA } from './schema'
import { REGISTRY } from './registry'
import { Db, QueryOpts, Row, TableName } from './types'

function whereSql(opts?: QueryOpts): { clause: string; params: (string | number)[] } {
  const parts: string[] = []
  const params: (string | number)[] = []
  for (const c of opts?.where ?? []) {
    if (c.op === 'isNull') parts.push(`${c.col} IS NULL`)
    else if (c.op === 'notNull') parts.push(`${c.col} IS NOT NULL`)
    else {
      const op = c.op === '!=' ? '<>' : c.op
      parts.push(`${c.col} ${op} ?`)
      params.push(c.value as string | number)
    }
  }
  return { clause: parts.length ? ` WHERE ${parts.join(' AND ')}` : '', params }
}

export type SqliteDatabase = {
  execAsync(sql: string): Promise<void>
  getAllAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T[]>
  runAsync(sql: string, params?: (string | number | null)[]): Promise<unknown>
  closeAsync(): Promise<void>
}

export function createSqliteDb(database: SqliteDatabase): Db {
  const q = <T>(sql: string, params: (string | number)[] = []) => database.getAllAsync<T>(sql, params)
  return {
    async select<T extends Row>(table: TableName, opts?: QueryOpts): Promise<T[]> {
      const { clause, params } = whereSql(opts)
      const order = opts?.order?.length ? ` ORDER BY ${opts.order.map(o => `${o.col}${o.desc ? ' DESC' : ''}`).join(', ')}` : ''
      const limit = opts?.limit ? ` LIMIT ${Math.trunc(opts.limit)}` : ''
      return (await q<T>(`SELECT * FROM ${table}${clause}${order}${limit}`, params)) as T[]
    },
    async insert(table: TableName, row: Row) {
      const def = REGISTRY[table]
      const cols = def.columns.filter(c => c in row)
      const placeholders = cols.map(() => '?').join(', ')
      await database.runAsync(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
        cols.map(c => row[c] as string | number | null)
      )
    },
    async upsert(table: TableName, row: Row) {
      const def = REGISTRY[table]
      const cols = def.columns.filter(c => c in row)
      const placeholders = cols.map(() => '?').join(', ')
      await database.runAsync(
        `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
        cols.map(c => row[c] as string | number | null)
      )
    },
    async update(table: TableName, id: string, patch: Row) {
      const def = REGISTRY[table]
      const cols = def.columns.filter(c => c in patch)
      if (!cols.length) return
      const sets = cols.map(c => `${c} = ?`).join(', ')
      await database.runAsync(`UPDATE ${table} SET ${sets} WHERE ${def.pk} = ?`, [
        ...cols.map(c => patch[c] as string | number | null),
        id,
      ])
    },
    async deleteById(table: TableName, id: string) {
      await database.runAsync(`DELETE FROM ${table} WHERE ${REGISTRY[table].pk} = ?`, [id])
    },
    async getMeta(key: string) {
      const rows = await q<{ value: string }>(`SELECT value FROM sync_meta WHERE key = ?`, [key])
      return rows[0]?.value ?? null
    },
    async setMeta(key: string, value: string) {
      await database.runAsync(`INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`, [key, value])
    },
    async close() {
      await database.closeAsync()
    },
  }
}

export async function openAppDb(): Promise<{ db: Db; native: boolean }> {
  try {
    const SQLite = require('expo-sqlite') as { openDatabaseAsync: (name: string) => Promise<SqliteDatabase> }
    const database = await SQLite.openDatabaseAsync('glicocontrol.sqlite')
    await database.execAsync('PRAGMA journal_mode = WAL')
    await database.execAsync(LOCAL_SCHEMA)
    return { db: createSqliteDb(database), native: true }
  } catch (e) {
    // web preview / ambiente sem módulo nativo: driver em memória (não persistente)
    const { createMemoryDb } = await import('./memory-db')
    return { db: await createMemoryDb(), native: false }
  }
}
