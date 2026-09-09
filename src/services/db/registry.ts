/** Registro estático de tabelas/colunas do espelho local. Fonte única (usada pelo driver SQLite). */
import { TableName } from './types'

export type TableDef = {
  table: TableName
  pk: string
  columns: readonly string[]
}

export const REGISTRY: Record<TableName, TableDef> = {
  local_profile: {
    table: 'local_profile',
    pk: 'id',
    columns: ['id', 'display_name', 'unit', 'locale', 'timezone', 'theme', 'onboarding_completed', 'consent_at', 'consent_version', 'updated_at', 'row_version', 'deleted_at'],
  },
  glucose_measurements: {
    table: 'glucose_measurements',
    pk: 'id',
    columns: ['id', 'user_id', 'value', 'unit', 'measured_at', 'local_date', 'local_time', 'tz_name', 'context', 'note', 'created_at', 'updated_at', 'row_version', 'deleted_at'],
  },
  reminders: {
    table: 'reminders',
    pk: 'id',
    columns: ['id', 'user_id', 'label', 'time_of_day', 'days_of_week', 'repeat', 'snooze_minutes', 'enabled', 'created_at', 'updated_at', 'row_version', 'deleted_at'],
  },
  medications: {
    table: 'medications',
    pk: 'id',
    columns: ['id', 'user_id', 'name', 'dose_text', 'instructions', 'active', 'created_at', 'updated_at', 'row_version', 'deleted_at'],
  },
  medication_schedules: {
    table: 'medication_schedules',
    pk: 'id',
    columns: ['id', 'user_id', 'medication_id', 'time_of_day', 'days_of_week', 'enabled', 'position', 'created_at', 'updated_at', 'row_version', 'deleted_at'],
  },
  medication_logs: {
    table: 'medication_logs',
    pk: 'id',
    columns: ['id', 'user_id', 'medication_id', 'schedule_id', 'action', 'logged_at', 'note', 'created_at', 'updated_at', 'row_version', 'deleted_at'],
  },
  glucose_targets: {
    table: 'glucose_targets',
    pk: 'id',
    columns: ['id', 'user_id', 'context', 'unit', 'min_value', 'max_value', 'notes', 'created_at', 'updated_at', 'row_version', 'deleted_at'],
  },
  sync_outbox: {
    table: 'sync_outbox',
    pk: 'seq',
    columns: ['seq', 'table_name', 'row_id', 'op', 'payload', 'proposed_updated_at', 'attempts', 'next_retry_at', 'last_error', 'created_at'],
  },
  sync_meta: { table: 'sync_meta', pk: 'key', columns: ['key', 'value'] },
}
