/** Registro de tabelas sincronizáveis: ordem (dependência de FK) + mapeamento local→servidor. */
export type SyncTableDef = {
  name:
    | 'glucose_measurements'
    | 'reminders'
    | 'medications'
    | 'medication_schedules'
    | 'medication_logs'
    | 'glucose_targets'
  /** RPC upsert com LWW: só grava se mais novo que o do servidor */
  rpc: (table: string) => string
}

/** Ordem importa: pais antes de filhos. */
export const SYNC_TABLES: SyncTableDef[] = [
  { name: 'medications', rpc: () => 'sync_upsert_row' },
  { name: 'reminders', rpc: () => 'sync_upsert_row' },
  { name: 'glucose_targets', rpc: () => 'sync_upsert_row' },
  { name: 'glucose_measurements', rpc: () => 'sync_upsert_row' },
  { name: 'medication_schedules', rpc: () => 'sync_upsert_row' },
  { name: 'medication_logs', rpc: () => 'sync_upsert_row' },
]

export const TABLE_TO_SERVER = {
  glucose_measurements: 'glucose_measurements',
  reminders: 'reminders',
  medications: 'medications',
  medication_schedules: 'medication_schedules',
  medication_logs: 'medication_logs',
  glucose_targets: 'glucose_targets',
  local_profile: 'profiles',
} as const
