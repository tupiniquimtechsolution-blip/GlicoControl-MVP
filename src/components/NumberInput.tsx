import React from 'react'
import { Input } from './Input'

type Props = {
  label: string
  value: string
  onChangeText: (t: string) => void
  unitSuffix?: string
  error?: string
  helper?: string
  testID?: string
}

/** Campo numérico decimal com teclado numérico; aceita vírgula decimal pt-BR. */
export function NumberInput({ label, value, onChangeText, unitSuffix, error, helper, testID = 'glucose-value' }: Props) {
  return (
    <Input
      label={label}
      value={value}
      onChangeText={t => onChangeText(t.replace(/[^0-9.,]/g, ''))}
      keyboardType="decimal-pad"
      suffix={unitSuffix}
      error={error}
      helper={helper ?? 'Use ponto ou vírgula como separador decimal.'}
      inputMode="decimal"
      accessibilityHint="Digite o valor medido no glicosímetro"
      testID="glucose-value"
    />
  )
}
