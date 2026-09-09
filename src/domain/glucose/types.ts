import { GlucoseContext } from './contexts'
import { GlucoseUnit } from './units'

export type GlucoseMeasurement = {
  id: string
  user_id: string
  value: number
  unit: GlucoseUnit
  /** instante absoluto (ISO 8601 com offset) — ordenação global e sync */
  measured_at: string
  /** dia local do paciente YYYY-MM-DD (chave do calendário/relatório) */
  local_date: string
  /** hora local HH:MM:SS */
  local_time: string
  tz_name: string
  context: GlucoseContext
  note: string | null
  row_version: number
  updated_at: string
  deleted_at: string | null
}

export type MeasurementDraft = {
  valueText: string
  unit: GlucoseUnit
  /** YYYY-MM-DD */
  localDate: string
  /** HH:MM */
  localTime: string
  context: GlucoseContext
  note: string
}

export type GlucoseTarget = {
  id: string
  user_id: string
  context: 'any' | GlucoseContext
  unit: GlucoseUnit
  min_value: number | null
  max_value: number | null
  notes: string | null
  updated_at: string
}
