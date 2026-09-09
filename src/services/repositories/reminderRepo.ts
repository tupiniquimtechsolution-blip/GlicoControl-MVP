/** Lembretes de medição: CRUD no espelho + outbox; agendamento local fica no serviço de notificações. */
import { Db, fromBool, Row, toBool, uuidv7 } from '../db/types'
import { enqueue } from '../sync/outbox'
import { normalizeWeekdays } from '../../domain/reminders/schedule'

export type Reminder = {
  id: string
  user_id: string
  label: string
  time_of_day: string
  days_of_week: number[]
  repeat: 'once' | 'daily' | 'weekly'
  snooze_minutes: number
  enabled: boolean
  updated_at: string
  row_version: number
  deleted_at: string | null
}

export type ReminderDraft = {
  label: string
  time_of_day: string
  days_of_week: number[]
  snooze_minutes: number
  enabled: boolean
  repeat?: 'once' | 'daily' | 'weekly'
}

function toLocal(id: string, userId: string, draft: ReminderDraft, now: string, rowVersion: number): Row {
  return {
    id,
    user_id: userId,
    label: draft.label.trim().slice(0, 40),
    time_of_day: draft.time_of_day,
    days_of_week: JSON.stringify(normalizeWeekdays(draft.days_of_week)),
    repeat: draft.repeat ?? 'weekly',
    snooze_minutes: draft.snooze_minutes,
    enabled: fromBool(draft.enabled),
    updated_at: now,
    row_version: rowVersion,
    deleted_at: null,
  }
}

export class ReminderRepo {
  constructor(private db: Db, private userId: () => string | null) {}

  private hydrate(r: Row): Reminder {
    return {
      id: String(r.id),
      user_id: String(r.user_id),
      label: String(r.label),
      time_of_day: String(r.time_of_day),
      days_of_week: typeof r.days_of_week === 'string' ? JSON.parse(r.days_of_week) : (r.days_of_week as number[]),
      repeat: (r.repeat as Reminder['repeat']) ?? 'weekly',
      snooze_minutes: Number(r.snooze_minutes),
      enabled: toBool(r.enabled),
      updated_at: String(r.updated_at),
      row_version: Number(r.row_version),
      deleted_at: r.deleted_at ? String(r.deleted_at) : null,
    }
  }

  private payload(row: Row): Row {
    return {
      id: row.id,
      label: row.label,
      time_of_day: row.time_of_day,
      days_of_week: JSON.parse(String(row.days_of_week)) as number[],
      repeat: row.repeat,
      snooze_minutes: row.snooze_minutes,
      enabled: toBool(row.enabled),
    }
  }

  async list(): Promise<Reminder[]> {
    const rows = await this.db.select<Row>('reminders', {
      where: [{ col: 'deleted_at', op: 'isNull' }],
      order: [{ col: 'time_of_day' }],
    })
    return rows.map(r => this.hydrate(r))
  }

  async get(id: string): Promise<Reminder | null> {
    const [row] = await this.db.select<Row>('reminders', { where: [{ col: 'id', op: '=', value: id }] })
    return row ? this.hydrate(row) : null
  }

  validate(draft: ReminderDraft): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!draft.label.trim()) errors.label = 'Dê um nome ao lembrete.'
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time_of_day)) errors.time_of_day = 'Horário inválido.'
    if (!normalizeWeekdays(draft.days_of_week).length) errors.days = 'Selecione ao menos um dia.'
    if (draft.snooze_minutes < 0 || draft.snooze_minutes > 240) errors.snooze = 'Snooze entre 0 e 240 minutos.'
    return errors
  }

  async create(draft: ReminderDraft): Promise<{ id: string; errors: Record<string, string> }> {
    const errors = this.validate(draft)
    if (Object.keys(errors).length) return { id: '', errors }
    const userId = this.userId()
    if (!userId) return { id: '', errors: { auth: 'Faça login.' } }
    const id = uuidv7()
    const now = new Date().toISOString()
    const row = toLocal(id, userId, draft, now, 1)
    await this.db.insert('reminders', { created_at: now, ...row })
    await enqueue(this.db, 'reminders', id, 'upsert', this.payload(row), now)
    return { id, errors: {} }
  }

  async update(id: string, draft: ReminderDraft): Promise<Record<string, string>> {
    const errors = this.validate(draft)
    if (Object.keys(errors).length) return errors
    const existing = await this.get(id)
    if (!existing) return { notfound: 'Lembrete não encontrado.' }
    const now = new Date().toISOString()
    const row = toLocal(id, existing.user_id, draft, now, existing.row_version + 1)
    await this.db.upsert('reminders', { id, created_at: existing.updated_at, ...row })
    const [stored] = await this.db.select<Row>('reminders', { where: [{ col: 'id', op: '=', value: id }], limit: 1 })
    await enqueue(this.db, 'reminders', id, 'upsert', this.payload(stored ?? row), now)
    return {}
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const existing = await this.get(id)
    if (!existing) return
    const now = new Date().toISOString()
    await this.db.update('reminders', id, { enabled: fromBool(enabled), updated_at: now, row_version: existing.row_version + 1 })
    const [row] = await this.db.select<Row>('reminders', { where: [{ col: 'id', op: '=', value: id }], limit: 1 })
    await enqueue(this.db, 'reminders', id, 'upsert', this.payload(row), now)
  }

  async softDelete(id: string): Promise<void> {
    const existing = await this.get(id)
    if (!existing) return
    const now = new Date().toISOString()
    await this.db.update('reminders', id, { deleted_at: now, updated_at: now, row_version: existing.row_version + 1 })
    await enqueue(this.db, 'reminders', id, 'soft_delete', { id }, now)
  }
}
