/**
 * Abstração do espelho local (offline-first). Os repositórios só conhecem esta API tipada;
 * a tabela/colunas vêm de um registro estático (sem interpolação de entrada do usuário).
 * Implementações: expo-sqlite no aparelho; memória (JS) em web preview/testes.
 * A sincronização com o servidor usa o SQL real de `supabase/migrations` (testado com PGlite).
 */
export const TABLES = [
  'local_profile',
  'glucose_measurements',
  'reminders',
  'medications',
  'medication_schedules',
  'medication_logs',
  'glucose_targets',
  'sync_outbox',
  'sync_meta',
] as const
export type TableName = (typeof TABLES)[number]

export type Row = Record<string, unknown>
export type WhereCond = { col: string; op: '=' | '>=' | '<=' | '!=' | 'isNull' | 'notNull'; value?: string | number | null }
export type QueryOpts = { where?: WhereCond[]; order?: { col: string; desc?: boolean }[]; limit?: number }

export interface Db {
  select<T extends Row = Row>(table: TableName, opts?: QueryOpts): Promise<T[]>
  insert(table: TableName, row: Row): Promise<void>
  upsert(table: TableName, row: Row): Promise<void> // por id (ou PK da tabela)
  update(table: TableName, id: string, patch: Row): Promise<void>
  deleteById(table: TableName, id: string): Promise<void>
  getMeta(key: string): Promise<string | null>
  setMeta(key: string, value: string): Promise<void>
  close(): Promise<void>
}

export function uuidv7(): string {
  const now = Date.now()
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  // 48 bits de milissegundos (prefixo ordenável por tempo = UUIDv7)
  bytes[0] = Math.floor(now / 2 ** 40) & 0xff
  bytes[1] = Math.floor(now / 2 ** 32) & 0xff
  bytes[2] = Math.floor(now / 2 ** 24) & 0xff
  bytes[3] = Math.floor(now / 2 ** 16) & 0xff
  bytes[4] = Math.floor(now / 2 ** 8) & 0xff
  bytes[5] = now & 0xff
  bytes[6] = (bytes[6] & 0x0f) | 0x70 // versão 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const toBool = (v: unknown): boolean => v === 1 || v === true || v === '1' || v === 't'
export const fromBool = (v: boolean): 0 | 1 => (v ? 1 : 0)
