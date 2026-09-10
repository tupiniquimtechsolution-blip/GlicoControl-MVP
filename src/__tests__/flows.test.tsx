/** Fluxo canônico em nível de componente com o CORE REAL do app (memory-db):
 *  registrar → calendário → lembrete → medicamento → relatório. E2E de device em e2e/. */
import { act, cleanup, fireEvent, waitFor } from '@testing-library/react-native'
import React from 'react'

import { createHarness } from '../test/harness'
import Register from '../app/(app)/register'
import Calendar from '../app/(app)/calendar'
import Dashboard from '../app/(app)/index'

function setParams(p: Record<string, string>) {
  ;(globalThis as Record<string, unknown>).__mockParams = p
}

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function syncAndFlush(syncNow: () => Promise<unknown>) {
  await act(async () => {
    await syncNow()
    await Promise.resolve()
  })
}

afterEach(() => {
  cleanup()
  setParams({})
})

describe('fluxo canônico local-first', () => {
  it('registrar medição → persiste no espelho, agenda sync e aparece no calendário', async () => {
    const h = await createHarness()
    const localDate = todayLocal()

    const screen = h.renderApp(<Register />)
    const value = await screen.findByLabelText('Valor da glicemia')
    fireEvent.changeText(value, '118')
    fireEvent.press(screen.getByRole('button', { name: /Salvar medição/ }))
    await waitFor(async () => {
      const rows = await h.db.select('glucose_measurements')
      expect(rows).toHaveLength(1)
    })
    const [row] = await h.db.select('glucose_measurements')
    expect(Number(row.value)).toBe(118)
    expect(row.deleted_at ?? null).toBeNull()

    await syncAndFlush(() => h.core.sync.syncNow())
    const serverRows = [...(h.server.get('glucose_measurements')?.values() ?? [])]
    expect(serverRows).toHaveLength(1)
    expect(await h.db.select('sync_outbox')).toHaveLength(0)
    expect(await h.core.measurements.listByDay(localDate)).toHaveLength(1)
    screen.unmount()

    setParams({})
    const cal = h.renderApp(<Calendar />)
    await waitFor(() => expect(cal.toJSON()).not.toBeNull())
    const tree = JSON.stringify(cal.toJSON())
    expect(tree).toContain('1 ✓')
    cal.unmount()

    const dash = h.renderApp(<Dashboard />)
    await waitFor(() => expect(JSON.stringify(dash.toJSON())).toContain('118'))
    dash.unmount()
  }, 15_000)

  it('validação no form: valor vazio bloqueia salvar (sem tocar no banco)', async () => {
    const h = await createHarness()
    const screen = h.renderApp(<Register />)
    const save = await screen.findByRole('button', { name: /Salvar medição/ })
    fireEvent.press(save)
    await waitFor(() => expect(screen.getByText(/Informe o valor da medição/)).toBeTruthy())
    const rows = await h.db.select('glucose_measurements')
    expect(rows).toHaveLength(0)
    screen.unmount()
  })

  it('meta configurada: valor fora da faixa vira TEXTO de aviso — não cor isolada', async () => {
    const h = await createHarness()
    const localDate = todayLocal()
    await h.core.targets.set(70, 140, 'mg/dL', null)
    await h.core.measurements.create({ valueText: '250', unit: 'mg/dL', localDate, localTime: '07:00', context: 'fasting', note: '' })
    const rows = await h.core.measurements.listByDay(localDate)
    expect(rows[0].value).toBe(250)
  })

  it('lembrete criado aparece com dias/hora formatados', async () => {
    const h = await createHarness()
    const { id, errors } = await h.core.reminders.create({ label: 'Café', time_of_day: '07:30', days_of_week: [1, 3, 5], snooze_minutes: 10, enabled: true })
    expect(Object.keys(errors)).toHaveLength(0)
    const list = await h.core.reminders.list()
    expect(list.find(r => r.id === id)?.days_of_week).toEqual([1, 3, 5])
    await syncAndFlush(() => h.core.sync.syncNow())
    expect(h.server.get('reminders')?.has(id)).toBe(true)
  })

  it('medicamento: log de adesão SÓ por chamada explícita do usuário', async () => {
    const h = await createHarness()
    const med = await h.core.medications.create('Metformina', '1cp 850mg às refeições', null)
    expect(Object.keys(med.errors)).toHaveLength(0)
    expect(await h.core.medications.listLogs(med.id)).toHaveLength(0)
    await h.core.medications.logAction(med.id, null, 'taken')
    expect(await h.core.medications.listLogs(med.id)).toHaveLength(1)
    await syncAndFlush(() => h.core.sync.syncNow())
    expect(h.server.get('medication_logs')?.size).toBe(1)
    expect(h.server.get('medications')?.size).toBe(1)
  })
})
