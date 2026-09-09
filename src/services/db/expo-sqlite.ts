/** Driver de produção: expo-sqlite (aparelho). Em web/ambiente sem módulo nativo cai para driver
 *  volátil com aviso — UI exibe banner "sessão local deste dispositivo". */
import type { Db, SqlParams } from './types'
import { LOCAL_SCHEMA } from './schema'

export async function openExpoSqliteDb(): Promise<{ db: Db; kind: 'native' | 'memory-fallback' }> {
  const fallback = await import('./memory-fallback')
  try {
    const SQLite = require('expo-sqlite')
    const database = await SQLite.openDatabaseAsync('glicocontrol.sqlite')
    await database.execAsync('PRAGMA journal_mode = WAL')
    await database.execAsync(LOCAL_SCHEMA)
    const db: Db = {
      exec: (script: string) => database.execAsync(script),
      all: <T>(sql: string, params: SqlParams = []) => database.getAllAsync<T>(sql, params),
      run: (sql: string, params: SqlParams = []) => database.runAsync(sql, params).then(() => undefined),
      close: () => database.closeAsync(),
    }
    return { db, kind: 'native' }
  } catch {
    return { db: await fallback.createMemoryDb(), kind: 'memory-fallback' }
  }
}
