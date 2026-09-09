/** Medicamentos informados pelo paciente + horários + logs de ação. O sistema NUNCA calcula/valida doses. */
import { Db, fromBool, Row, toBool, uuidv7 } from '../db/types'
import { enqueue } from '../sync/outbox'
import { normalizeWeekdays } from '../../domain/reminders/schedule'

export type Medication = {
  id: string
  user_id: string
  name: string
  dose_text: string
  instructions: string | null
  active: boolean
  updated_at: string
  row_version: number
}

export type MedicationSchedule = {
  id: string
  medication_id: string
  time_of_day: string
  days_of_week: number[]
  enabled: boolean
  position: number
}

export type MedicationLog = {
  id: string
  medication_id: string
  schedule_id: string | null
  action: 'taken' | 'snoozed' | 'skipped'
  logged_at: string
  note: string | null
}

export const LOG_ACTION_LABELS: Record<MedicationLog['action'], string> = {
  taken: 'Tomei',
  snoozed: 'Adiei',
  skipped: 'Ignorei',
}

function validateMed(draft: { name: string; dose_text: string; instructions?: string }): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.name.trim() || draft.name.trim().length > 80) errors.name = 'Nome obrigatório (máx. 80 caracteres).'
  if (!draft.dose_text.trim() || draft.dose_text.trim().length > 60) errors.dose = 'Dose é um texto livre seu (máx. 60 caracteres).'
  if ((draft.instructions?.length ?? 0) > 200) errors.instructions = 'Observações: máx. 200 caracteres.'
  return errors
}

export class MedicationRepo {
  constructor(private db: Db, private userId: () => string | null) {}

  private hydrateMed(r: Row): Medication {
    return {
      id: String(r.id), user_id: String(r.user_id), name: String(r.name), dose_text: String(r.dose_text),
      instructions: r.instructions ? String(r.instructions) : null, active: toBool(r.active),
      updated_at: String(r.updated_at), row_version: Number(r.row_version),
    }
  }

  private hydrateSched(r: Row): MedicationSchedule {
    return {
      id: String(r.id), medication_id: String(r.medication_id), time_of_day: String(r.time_of_day),
      days_of_week: typeof r.days_of_week === 'string' ? JSON.parse(r.days_of_week) : (r.days_of_week as number[]),
      enabled: toBool(r.enabled), position: Number(r.position),
    }
  }

  async list(): Promise<{ medication: Medication; schedules: MedicationSchedule[] }[]> {
    const meds = (await this.db.select<Row>('medications', { where: [{ col: 'deleted_at', op: 'isNull' }], order: [{ col: 'name' }] })).map(r => this.hydrateMed(r))
    const scheds = (await this.db.select<Row>('medication_schedules', { where: [{ col: 'deleted_at', op: 'isNull' }] })).map(r => this.hydrateSched(r))
    return meds.map(m => ({ medication: m, schedules: scheds.filter(s => s.medication_id === m.id).sort((a, b) => a.time_of_day.localeCompare(b.time_of_day)) }))
  }

  async create(name: string, dose_text: string, instructions: string | null): Promise<{ id: string; errors: Record<string, string> }> {
    const errors = validateMed({ name, dose_text: dose_text, instructions: instructions ?? undefined })
    if (Object.keys(errors).length) return { id: '', errors }
    const userId = this.userId()
    if (!userId) return { id: '', errors: { auth: 'Faça login.' } }
    const id = uuidv7()
    const now = new Date().toISOString()
    const row = { id, user_id: userId, name: name.trim(), dose_text: dose_text.trim(), instructions: instructions?.trim() || null, active: fromBool(true), updated_at: now, row_version: 1, deleted_at: null }
    await this.db.insert('medications', { created_at: now, ...row })
    await enqueue(this.db, 'medications', id, 'upsert', { id, name: row.name, dose_text: row.dose_text, instructions: row.instructions, active: true }, now)
    return { id, errors: {} }
  }

  async update(id: string, name: string, dose_text: string, instructions: string | null, active: boolean): Promise<Record<string, string>> {
    const errors = validateMed({ name, dose_text, instructions: instructions ?? undefined })
    if (Object.keys(errors).length) return errors
    const [existing] = await this.db.select<Row>('medications', { where: [{ col: 'id', op: '=', value: id }] })
    if (!existing) return { notfound: 'Medicamento não encontrado.' }
    const now = new Date().toISOString()
    const patch = { name: name.trim(), dose_text: dose_text.trim(), instructions: instructions?.trim() || null, active: fromBool(active), updated_at: now, row_version: Number(existing.row_version) + 1 }
    await this.db.update('medications', id, patch)
    await enqueue(this.db, 'medications', id, 'upsert', { id, name: patch.name, dose_text: patch.dose_text, instructions: patch.instructions, active }, now)
    return {}
  }

  async setActive(id: string, active: boolean): Promise<void> {
    const [existing] = await this.db.select<Row>('medications', { where: [{ col: 'id', op: '=', value: id }] })
    if (!existing) return
    const now = new Date().toISOString()
    await this.db.update('medications', id, { active: fromBool(active), updated_at: now, row_version: Number(existing.row_version) + 1 })
    await enqueue(this.db, 'medications', id, 'upsert', { id, name: existing.name, dose_text: existing.dose_text, instructions: existing.instructions, active }, now)
  }

  async softDelete(id: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.update('medications', id, { deleted_at: now, updated_at: now })
    await enqueue(this.db, 'medications', id, 'soft_delete', { id }, now)
    for (const s of await this.db.select<Row>('medication_schedules', { where: [{ col: 'medication_id', op: '=', value: id }, { col: 'deleted_at', op: 'isNull' }] })) {
      await this.db.update('medication_schedules', String(s.id), { deleted_at: now, updated_at: now })
      await enqueue(this.db, 'medication_schedules', String(s.id), 'soft_delete', { id: s.id }, now)
    }
  }

  async addSchedule(medicationId: string, timeOfDay: string, days: number[], position = 0): Promise<Record<string, string>> {
    const norm = normalizeWeekdays(days)
    if (!norm.length) return { days: 'Selecione ao menos um dia.' }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeOfDay)) return { time: 'Horário inválido.' }
    const userId = this.userId()
    if (!userId) return { auth: 'Faça login.' }
    const id = uuidv7()
    const now = new Date().toISOString()
    await this.db.insert('medication_schedules', {
      id, user_id: userId, medication_id: medicationId, time_of_day: timeOfDay,
      days_of_week: JSON.stringify(norm), enabled: fromBool(true), position,
      created_at: now, updated_at: now, row_version: 1, deleted_at: null,
    })
    await enqueue(this.db, 'medication_schedules', id, 'upsert', { id, medication_id: medicationId, time_of_day: timeOfDay, days_of_week: norm, enabled: true, position }, now)
    return {}
  }

  async removeSchedule(scheduleId: string): Promise<void> {
    const now = new Date().toISOString()
    await this.db.update('medication_schedules', scheduleId, { deleted_at: now, updated_at: now })
    await enqueue(this.db, 'medication_schedules', scheduleId, 'soft_delete', { id: scheduleId }, now)
  }

  async toggleSchedule(scheduleId: string): Promise<void> {
    const [s] = await this.db.select<Row>('medication_schedules', { where: [{ col: 'id', op: '=', value: scheduleId }] })
    if (!s) return
    const now = new Date().toISOString()
    const enabled = !toBool(s.enabled)
    await this.db.update('medication_schedules', scheduleId, { enabled: fromBool(enabled), updated_at: now })
    await enqueue(this.db, 'medication_schedules', scheduleId, 'upsert', { id: scheduleId, medication_id: s.medication_id, time_of_day: s.time_of_day, days_of_week: JSON.parse(String(s.days_of_week)), enabled, position: s.position }, now)
  }

  /** ÚNICA origem de log de adesão: ação manual do usuário (nunca o disparo da notificação). */
  async logAction(medicationId: string, scheduleId: string | null, action: MedicationLog['action'], note?: string): Promise<Record<string, string>> {
    const userId = this.userId()
    if (!userId) return { auth: 'Faça login.' }
    const id = uuidv7()
    const now = new Date().toISOString()
    await this.db.insert('medication_logs', {
      id, user_id: userId, medication_id: medicationId, schedule_id: scheduleId, action,
      logged_at: now, note: note?.slice(0, 200) || null,
      created_at: now, updated_at: now, row_version: 1, deleted_at: null,
    })
    await enqueue(this.db, 'medication_logs', id, 'upsert', { id, medication_id: medicationId, schedule_id: scheduleId, action, logged_at: now, note: note?.slice(0, 200) || null }, now)
    return {}
  }

  async listLogs(medicationId?: string): Promise<MedicationLog[]> {
    const rows = await this.db.select<Row>('medication_logs', {
      where: [
        { col: 'deleted_at', op: 'isNull' },
        ...(medicationId ? [{ col: 'medication_id', op: '=' as const, value: medicationId }] : []),
      ],
      order: [{ col: 'logged_at', desc: true }],
      limit: 200,
    })
    return rows.map(r => ({
      id: String(r.id), medication_id: String(r.medication_id),
      schedule_id: r.schedule_id ? String(r.schedule_id) : null,
      action: r.action as MedicationLog['action'], logged_at: String(r.logged_at),
      note: r.note ? String(r.note) : null,
    }))
  }

  /** contagens de adesão do mês — números puros, sem interpretação */
  async monthAdherence(monthKey: string): Promise<Record<MedicationLog['action'], number>> {
    const logs = await this.listLogs()
    const out: Record<MedicationLog['action'], number> = { taken: 0, snoozed: 0, skipped: 0 }
    for (const l of logs) if (l.logged_at.startsWith(monthKey)) out[l.action]++
    return out
  }

  /** próximo horário (hoje) de medicamento ativo para o dashboard */
  async nextDue(now = new Date()): Promise<{ medication: Medication; schedule: MedicationSchedule; when: Date } | null> {
    const items = await this.list()
    const day = now.getDay()
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    let best: { medication: Medication; schedule: MedicationSchedule; when: Date } | null = null
    for (const { medication, schedules } of items) {
      if (!medication.active) continue
      for (const s of schedules) {
        if (!s.enabled) continue
        if (!s.days_of_week.includes(day)) continue
        if (s.time_of_day.slice(0, 5) < hhmm) continue
        const when = new Date(now)
        const [h, m] = s.time_of_day.split(':').map(Number)
        when.setHours(h, m, 0, 0)
        if (!best || when < best.when) best = { medication, schedule: s, when }
      }
    }
    return best
  }
}
