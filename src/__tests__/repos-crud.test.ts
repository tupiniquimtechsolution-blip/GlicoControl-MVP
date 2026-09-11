/** CRUD local-first: criação, merge por minuto, edição, exclusão, lembretes, medicamentos/adesão. */
import { createMemoryDb } from '../services/db/memory-db'
import { MeasurementRepo } from '../services/repositories/measurementRepo'
import { ReminderRepo } from '../services/repositories/reminderRepo'
import { MedicationRepo } from '../services/repositories/medicationRepo'
import { TargetRepo } from '../services/repositories/targetRepo'

const uid = 'u1'
const userId = () => uid

describe('measurementRepo', () => {
  it('cria leitura-estável com dedupe por minuto+contexto (anti duplo-clique)', async () => {
    const db = await createMemoryDb()
    const repo = new MeasurementRepo(db, userId)
    const draft = { valueText: '95', unit: 'mg/dL' as const, localDate: '2026-09-09', localTime: '07:00', context: 'fasting' as const, note: '' }
    const first = await repo.create(draft)
    expect(Object.keys(first.errors)).toHaveLength(0)
    const again = await repo.create(draft) // mesmo minuto+contexto → merge
    expect(again.merged).toBe(true)
    expect(again.id).toBe(first.id)
    const rows = await repo.listByDay('2026-09-09')
    expect(rows).toHaveLength(1)
  })

  it('rejeita rascunho inválido e aceita edição válida', async () => {
    const db = await createMemoryDb()
    const repo = new MeasurementRepo(db, userId)
    const bad = await repo.create({ valueText: '', unit: 'mg/dL', localDate: '2026-09-09', localTime: '07:00', context: 'fasting', note: '' } as never)
    expect(bad.errors.valueText).toBeDefined()
    const ok = await repo.create({ valueText: '110', unit: 'mg/dL', localDate: '2026-09-10', localTime: '08:30', context: 'after_breakfast', note: 'café com pão' } as never)
    const errs = await repo.update(ok.id, { value: 115 })
    expect(errs).toEqual({})
    const rows = await repo.listByDay('2026-09-10')
    expect(rows[0].value).toBe(115)
    expect(rows[0].note).toBe('café com pão')
  })

  it('soft delete sai das listagens mas mantém tombstone para sync', async () => {
    const db = await createMemoryDb()
    const repo = new MeasurementRepo(db, userId)
    const { id } = await repo.create({ valueText: '88', unit: 'mg/dL', localDate: '2026-09-11', localTime: '07:00', context: 'fasting', note: '' } as never)
    await repo.softDelete(id)
    expect(await repo.get(id)).toBeNull()
    const raw = await db.select('glucose_measurements', { where: [{ col: 'id', op: '=', value: id }] })
    expect(raw[0].deleted_at).toBeTruthy()
    const outbox = await db.select('sync_outbox', { where: [{ col: 'op', op: '=', value: 'soft_delete' }] })
    expect(outbox).toHaveLength(1)
  })
})

describe('reminderRepo', () => {
  it('valida dias/hora e normaliza semana', async () => {
    const db = await createMemoryDb()
    const repo = new ReminderRepo(db, userId)
    const bad = await repo.create({ label: '', time_of_day: '25:00', days_of_week: [], snooze_minutes: 10, enabled: true })
    expect(bad.errors.label).toBeDefined()
    expect(bad.errors.time_of_day).toBeDefined()
    expect(bad.errors.days).toBeDefined()
    const ok = await repo.create({ label: 'Café', time_of_day: '07:30', days_of_week: [3, 1, 1], snooze_minutes: 15, enabled: true })
    expect(Object.keys(ok.errors)).toHaveLength(0)
    const list = await repo.list()
    expect(list[0].days_of_week).toEqual([1, 3])
    await repo.setEnabled(ok.id, false)
    expect((await repo.list())[0].enabled).toBe(false)
    await repo.softDelete(ok.id)
    expect(await repo.list()).toHaveLength(0)
  })
})

describe('medications: nada automático', () => {
  it('log só existe quando o usuário chama logAction', async () => {
    const db = await createMemoryDb()
    const repo = new MedicationRepo(db, userId)
    const { id, errors } = await repo.create('Insulina (receita do médico)', '2 unidades às 07h — anotação minha', null)
    expect(Object.keys(errors)).toHaveLength(0)
    expect(await repo.listLogs(id)).toHaveLength(0) // receber lembrete não cria log
    await repo.logAction(id, null, 'taken')
    await repo.logAction(id, null, 'skipped')
    const logs = await repo.listLogs(id)
    expect(logs.map(l => l.action).sort()).toEqual(['skipped', 'taken'])
    const adher = await repo.monthAdherence('2026-09')
    expect(adher.taken).toBe(1)
    expect(adher.skipped).toBe(1)
  })

  it('schedule com horário inválido rejeitado; toggle ok', async () => {
    const db = await createMemoryDb()
    const repo = new MedicationRepo(db, userId)
    const med = await repo.create('Vitamina D', '1 gota', null)
    const bad = await repo.addSchedule(med.id, '99:99', [1])
    expect(bad.time).toBeDefined()
    const good = await repo.addSchedule(med.id, '09:00', [1, 2])
    expect(good).toEqual({})
    const items = await repo.list()
    const sched = items[0].schedules[0]
    await repo.toggleSchedule(sched.id)
    const after = await repo.list()
    expect(after[0].schedules[0].enabled).toBe(false)
  })

  it('nextDue só considera ativos com horário futuro de hoje', async () => {
    const db = await createMemoryDb()
    const repo = new MedicationRepo(db, userId)
    const now = new Date(2026, 8, 9, 12, 0, 0, 0)
    const today = now.getDay()

    const med = await repo.create('Ômega', '1 cápsula', null)
    await repo.addSchedule(med.id, '13:00', [today])
    expect(await repo.nextDue(now)).toBeTruthy()

    const past = await repo.create('Cálcio', '1cp', null)
    await repo.addSchedule(past.id, '11:00', [today])
    const due = await repo.nextDue(now)
    expect(due?.medication.name).toBe('Ômega')
  })
})

describe('targets', () => {
  it('banda mínima < máxima; valores esdrúxulos rejeitados', async () => {
    const db = await createMemoryDb()
    const repo = new TargetRepo(db, userId)
    expect(Object.keys(await repo.set(200, 100, 'mg/dL', null)).length).toBeGreaterThan(0)
    expect(Object.keys(await repo.set(70, 180, 'mg/dL', null))).toHaveLength(0)
    const t = await repo.get('any')
    expect(t?.min).toBe(70)
    expect(t?.max).toBe(180)
  })
})
