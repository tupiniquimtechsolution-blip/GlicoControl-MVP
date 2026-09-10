/** Perfil: nome, unidade padrão, fuso e meta configurável (banda exibicional). */
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { NumberInput } from '../../components/NumberInput'
import { Screen } from '../../components/Screen'
import { Select } from '../../components/Select'
import { useToast } from '../../components/Toast'
import { GlucoseUnit, UNIT_MGDL, UNIT_MMOLL } from '../../domain/glucose/units'
import { useApp } from '../../services/appContext'
import { useAuth } from '../../features/auth/AuthContext'
import { useAppTheme } from '../../theme/ThemeProvider'

export default function ProfileSettings() {
  const app = useApp()
  const { user } = useAuth()
  const toast = useToast()
  const { theme, t } = useAppTheme()
  const [name, setName] = useState('')
  const [unit, setUnit] = useState<GlucoseUnit>(UNIT_MGDL)
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      const p = await app.profile.get()
      const tg = await app.targets.get('any')
      if (p) {
        setName(p.display_name ?? '')
        setUnit(p.unit)
      }
      if (tg) {
        setMin(tg.min != null ? String(tg.min) : '')
        setMax(tg.max != null ? String(tg.max) : '')
      }
      setReady(true)
    })()
  }, [app])

  const save = () => {
    setSaving(true)
    void (async () => {
      if (!user) return
      await app.profile.save({ id: user.id, display_name: name.trim() || null, unit, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, onboarding_completed: true })
      const minV = min.trim() === '' ? null : Number(min.replace(',', '.'))
      const maxV = max.trim() === '' ? null : Number(max.replace(',', '.'))
      const errs = await app.targets.set(Number.isFinite(minV as number) ? (minV as number) : null, Number.isFinite(maxV as number) ? (maxV as number) : null, unit, null)
      if (Object.keys(errs).length) toast.show(errs.max ?? errs.range ?? 'Valores da meta inválidos.', 'error')
      else {
        await app.gateway.upsertProfile(user.id, { display_name: name.trim() || null, unit, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }).catch(() => undefined)
        app.bump()
        toast.show('Perfil salvo.')
      }
    })().finally(() => setSaving(false))
  }

  if (!ready) return <Screen title="Perfil" scroll={false}><></></Screen>
  return (
    <Screen title="Perfil, unidade e metas">
      <Card style={{ gap: t.spacing.md }}>
        <Input label="Nome (para o relatório)" value={name} onChangeText={setName} helper="Aparece no PDF." />
        <Select
          label="Unidade padrão"
          value={unit}
          options={[{ value: UNIT_MGDL, label: 'mg/dL (padrão no Brasil)' }, { value: UNIT_MMOLL, label: 'mmol/L' }]}
          onChange={setUnit}
        />
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          <View style={{ flex: 1 }}><NumberInput label={`Meta mínima (${unit})`} value={min} onChangeText={setMin} /></View>
          <View style={{ flex: 1 }}><NumberInput label={`Meta máxima (${unit})`} value={max} onChangeText={setMax} /></View>
        </View>
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
          A meta é uma referência QUE VOCÊ (ou seu profissional de saúde) configurou. O app apenas mostra quando um
          valor está fora da faixa escolhida — ele não interpreta, não alerta e não altera tratamento.
        </Text>
        <Button label="Salvar" onPress={save} loading={saving} fullWidth />
      </Card>
    </Screen>
  )
}
