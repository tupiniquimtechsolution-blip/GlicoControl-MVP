import { render } from '@testing-library/react-native'
import React from 'react'
import { Button } from '../components/Button'
import { CalendarDay } from '../components/CalendarDay'
import { MeasurementCard } from '../components/MeasurementCard'
import { ThemeProvider } from '../theme/ThemeProvider'
import { NumberInput } from '../components/NumberInput'
import { Input } from '../components/Input'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'

const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>)

describe('design system acessível', () => {
  it('Button expõe role button e label textual', () => {
    const { getByRole } = wrap(<Button label="Salvar" onPress={jest.fn()} />)
    const btn = getByRole('button', { name: 'Salvar' })
    expect(btn).toBeTruthy()
  })
  it('Input associa label e anuncia erro (liveRegion)', () => {
    const { getByLabelText, getByText } = wrap(<Input label="E-mail" value="a@b.c" onChangeText={jest.fn()} error="inválido" />)
    expect(getByLabelText('E-mail')).toBeTruthy()
    expect(getByText('⚠ inválido').props.accessibilityLiveRegion).toBe('polite')
  })
  it('NumberInput filtra texto não numérico', () => {
    let v = ''
    const { getByLabelText } = wrap(<NumberInput label="Valor" value={v} onChangeText={x => (v = x)} />)
    const input = getByLabelText('Valor')
    input.props.onChangeText?.('12ab.5x')
    expect(v).toBe('12.5')
  })
  it('CalendarDay comunica por TEXTO a contagem', () => {
    const { getByRole } = wrap(
      <CalendarDay cell={{ date: '2026-09-09', inMonth: true, dayOfMonth: 9 }} count={3} isToday isFuture={false} onPress={jest.fn()} />
    )
    const day = getByRole('button', { name: /9 de setembro de 2026, hoje: 3 medições/ })
    expect(day).toBeTruthy()
  })
  it('MeasurementCard exibe meta fora da faixa como texto (seta + palavras)', () => {
    const { getByText } = wrap(
      <MeasurementCard
        measurement={{ id: '1', user_id: 'u', value: 250, unit: 'mg/dL', measured_at: '2026-09-09T10:00:00Z', local_date: '2026-09-09', local_time: '07:00:00', tz_name: 'UTC', context: 'fasting', note: null, row_version: 1, updated_at: '2026-09-09T10:00:00Z', deleted_at: null }}
        displayUnit="mg/dL"
        targetBand={{ min: 70, max: 180 }}
      />
    )
    expect(getByText(/Acima da sua meta configurada/)).toBeTruthy()
  })
  it('EmptyState/ErrorState com ações e texto', () => {
    const { getByText } = wrap(<EmptyState title="Nada aqui" actionLabel="Criar" onAction={jest.fn()} />)
    expect(getByText('Nada aqui')).toBeTruthy()
    void getByText
    const { getByText: g2 } = wrap(<ErrorState message="falhou" offline onRetry={jest.fn()} />)
    expect(g2('Modo offline')).toBeTruthy()
  })
  it('alvos de toque: Button ≥56', () => {
    const r = wrap(<Button label="X" onPress={jest.fn()} />)
    const json = JSON.stringify(r.toJSON())
    expect(json).toContain('"minHeight":56')
  })
})