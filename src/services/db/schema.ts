/** Schema local (SQLite) — espelho das tabelas centrais + outbox + meta.
 *  Mesma sintaxe SQL executada nos testes com PGlite (Postgres). Mantida no dialeto comum
 *  (TEXT/INTEGER, sem tipos específicos de nenhum dos dois lados). */
export const LOCAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS local_profile (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  unit TEXT NOT NULL DEFAULT 'mg/dL',
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  timezone TEXT,
  theme TEXT NOT NULL DEFAULT 'system',
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  consent_at TEXT,
  consent_version TEXT,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS glucose_measurements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  measured_at TEXT NOT NULL,
  local_date TEXT NOT NULL,
  local_time TEXT NOT NULL,
  tz_name TEXT NOT NULL,
  context TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_glucose_user_day ON glucose_measurements (user_id, local_date, local_time);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  days_of_week TEXT NOT NULL,
  repeat TEXT NOT NULL DEFAULT 'weekly',
  snooze_minutes INTEGER NOT NULL DEFAULT 10,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dose_text TEXT NOT NULL,
  instructions TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS medication_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  medication_id TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  days_of_week TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS medication_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  medication_id TEXT NOT NULL,
  schedule_id TEXT,
  action TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS glucose_targets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT 'any',
  unit TEXT NOT NULL,
  min_value REAL,
  max_value REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  seq TEXT NOT NULL PRIMARY KEY,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  op TEXT NOT NULL,
  payload TEXT NOT NULL,
  proposed_updated_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT NOT NULL,
  last_error TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (table_name, row_id)
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`
