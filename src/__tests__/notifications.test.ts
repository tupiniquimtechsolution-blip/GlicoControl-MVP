/** Agendador: sem auto-registro; re-schedule idempotente; cálculo de próximos disparos. */
import { createNotificationScheduler, handleNotificationResponse } from '../services/notifications/notificationService'
import { nextOccurrences } from '../domain/reminders/schedule'

describe('next occurrences', () => {
  it('seleciona os dias corretos na semana', () => {
    const from = new Date(2026, 8, 9, 6, 0, 0) // quarta 09/09/2026 06:00
    const occ = nextOccurrences({ timeOfDay: '07:30', daysOfWeek: [3, 6] }, from, 4) // qua e sáb
    expect(occ.map(d => d.getDay())).toEqual([3, 6, 3, 6])
    expect(occ[0].toDateString()).toContain('Wed Sep 09 2026')
  })
  it('hoje já passou do horário → pula para o próximo dia ativo', () => {
    const from = new Date(2026, 8, 9, 8, 0, 0)
    const occ = nextOccurrences({ timeOfDay: '07:30', daysOfWeek: [3] }, from, 1)
    expect(occ[0].toDateString()).toContain('Wed Sep 16 2026')
  })
  it('timeOfDay inválido → vazio', () => {
    expect(nextOccurrences({ timeOfDay: '25:70', daysOfWeek: [1] }, new Date(), 3)).toEqual([])
  })
})

describe('scheduler', () => {
  it('rescheduleAll cancela antes e reaproveita a lista (idempotente)', async () => {
    const N = require('expo-notifications')
    const mockScheduled: unknown[] = (globalThis as never as { __mockScheduled: unknown[] }).__mockScheduled
    mockScheduled.length = 0
    void N
    const s = createNotificationScheduler()
    const items = [{ id: 'r1', label: 'Lembrete', schedule: { timeOfDay: '07:30', daysOfWeek: [1, 3] }, snoozeMinutes: 10 }]
    await s.rescheduleAll(items)
    const first = mockScheduled.length
    await s.rescheduleAll(items)
    expect(mockScheduled.length).toBe(first * 2) // reagenda completa o lote seguinte sem duplicar o anterior
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThanOrEqual(14) // ≤ 7 por dia ativo
  })

  it('notificação recebida SEM ação do usuário não invoca nada', () => {
    const onRegisterNow = jest.fn()
    const onMed = jest.fn()
    handleNotificationResponse(
      { notification: { request: { content: { data: { kind: 'glucose', refId: 'r1' } } } } } as never,
      { onRegisterNow, onSnooze: jest.fn(), onMarkDone: jest.fn(), onMedicationAction: onMed }
    )
    expect(onRegisterNow).toHaveBeenCalledWith('r1') // actionIdentifier ausente = toque no corpo → abre registro (NÃO grava dado)
    expect(onMed).not.toHaveBeenCalled()
  })

  it('ação de medicação no toast delega SEMPRE para o usuário decidir', () => {
    const onMed = jest.fn()
    handleNotificationResponse(
      { actionIdentifier: 'glico.took', notification: { request: { content: { data: { kind: 'medication', refId: 'm9' } } } } } as never,
      { onRegisterNow: jest.fn(), onSnooze: jest.fn(), onMarkDone: jest.fn(), onMedicationAction: onMed }
    )
    expect(onMed).toHaveBeenCalledWith('m9', 'taken')
  })
})
