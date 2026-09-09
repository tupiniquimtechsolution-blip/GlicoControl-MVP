/** Tela de registro: valor + contexto + data/hora + observação. ≤4 toques até salvar (§8 prompt mestre). */
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Chip } from '../../components/Chip'
import { ConfirmationDialog } from '../../components/ConfirmationDialog'
import { DateTimeField } from '../../components/DateTimeField'
import { Input } from '../../components/Input'
import { NumberInput } from '../../components/NumberInput'
import { Screen } from '../../components/Screen'
import { Select } from '../../components/Select'
import { CONTEXT_LABELS_PT, GLUCOSE_CONTEXTS, GlucoseContext } from '../../domain/glucose/contexts'
import { MeasurementDraft } from '../../domain/glucose/types'
import { VALUE_ERROR_MESSAGES_PT, plausibilityConfirmText, validateGlucoseValue } from '../../domain/glucose/validation'
import { convertGlucose, GLUCOSE_UNITS, GlucoseUnit, UNIT_MGDL } from '../../domain/glucose/units'
import { nowHm, todayYmd } from '../../domain/dates/month'
import { useApp } from '../../services/appContext'
import { useAppTheme } from '../../theme/ThemeProvider'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../features/auth/AuthContext'

export default function RegisterScreen() {
  const app = useApp()
  const { theme, t } = useAppTheme()
  const toast = useToast()
  const { user } = useAuth()
  const params = useLocalSearchParams<{ id?: string }>()
  const editingId = params.id ?? null

  const [unit, setUnit] = useState<GlucoseUnit>(UNIT_MGDL)
  const [valueText, setValueText] = useState('')
  const [context, setContext] = useState<GlucoseContext>('fasting')
  const [localDate, setLocalDate] = useState(todayYmd())
  const [localTime, setLocalTime] = useState(nowHm())
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingConfirm, setPendingConfirm] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void (async () => {
      const profile = await app.profile.get()
      if (profile) setUnit(profile.unit)
      if (editingId) {
        const m = await app.measurements.get(editingId)
        if (m) {
          setUnit(m.unit)
          setValueText(String(m.value))
          setContext(m.context)
          setLocalDate(m.local_date)
          setLocalTime(m.local_time.slice(0, 5))
          setNote(m.note ?? '')
        }
      }
      setLoaded(true)
    })()
  }, [app, editingId])

  const doSave = useCallback(async () => {
    if (saving) return // anti duplo-clique: 2º toque vira no-op até o 1º terminar
    const draft: MeasurementDraft = { valueText, unit, localDate, localTime: localTime.length === 5 ? `${localTime}:00` : localTime, context, note }
    setSaving(true)
    try {
      if (editingId) {
        const v = validateGlucoseValue(valueText, unit)
        if (v.status !== 'error') {
          const errs = await app.measurements.update(editingId, { value: (v.value as number), unit, localDate, localTime, context, note: note || null })
          if (Object.keys(errs).length) setErrors(errs)
          else {
            app.bump()
            toast.show('Medição atualizada.')
            router.back()
          }
        } else setErrors({ valueText: VALUE_ERROR_MESSAGES_PT[v.reason] })
      } else {
        const res = await app.measurements.create(draft)
        if (Object.keys(res.errors).length) setErrors(res.errors)
        else {
          app.bump()
          toast.show(res.merged ? 'Já existia medição neste minuto/contexto — valor atualizado.' : 'Medição salva.')
          router.back()
        }
      }
    } finally {
      setSaving(false)
    }
  }, [app, context, editingId, localDate, localTime, note, saving, toast, unit, valueText])

  const submit = useCallback(() => {
    setErrors({})
    const v = validateGlucoseValue(valueText, unit)
    if (v.status === 'confirm') {
      setPendingConfirm(v.value)
      return
    }
    if (v.status === 'error') {
      setErrors({ valueText: VALUE_ERROR_MESSAGES_PT[v.reason] })
      return
    }
    void doSave()
  }, [doSave, unit, valueText])

  if (!loaded) {
    return <Screen title="Registrar medição" scroll={false}><></></Screen>
  }

  return (
    <Screen
      title={editingId ? 'Editar medição' : 'Registrar medição'}
      subtitle={editingId ? undefined : 'Leva poucos segundos — funciona mesmo sem internet.'}
    >
      <Card style={{ gap: t.spacing.md }}>
        <NumberInput
          testID="register-value"
          label="Valor da glicemia"
          value={valueText}
          onChangeText={setValueText}
          unitSuffix={unit}
          error={errors.valueText}
        />
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {GLUCOSE_UNITS.map(u => (
            <Chip
              key={u}
              size="sm"
              label={u}
              selected={u === unit}
              onPress={() => {
                if (u === unit) return
                const v = validateGlucoseValue(valueText, unit)
                if (v.status !== 'error') setValueText(String(convertGlucose(v.value, unit, u)))
                setUnit(u)
              }}
            />
          ))}
        </View>
        <Select
          label="Contexto / período"
          value={context}
          options={GLUCOSE_CONTEXTS.map(c => ({ value: c, label: CONTEXT_LABELS_PT[c] }))}
          onChange={setContext}
          error={errors.context}
        />
        <DateTimeField localDate={localDate} localTime={localTime} onChange={(d, tm) => { setLocalDate(d); setLocalTime(tm) }} />
        {errors.localDate || errors.localTime ? (
          <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger }}>⚠ {errors.localDate ?? errors.localTime}</Text>
        ) : null}
        <Input
          label="Observação (opcional)"
          value={note}
          onChangeText={setNote}
          multiline
          helper={`Máx. 500 caracteres${note.length > 460 ? ` · faltam ${500 - note.length}` : ''}`}
          error={errors.note}
        />
        <Button label={editingId ? 'Salvar alterações' : 'Salvar medição'} onPress={submit} loading={saving} fullWidth />
        {editingId ? (
          <Button
            label="Excluir medição"
            variant="danger"
            onPress={() => {
              void app.measurements.softDelete(editingId).then(() => {
                app.bump()
                toast.show('Medição excluída.')
                router.back()
              })
            }}
          />
        ) : null}
      </Card>
      <ConfirmationDialog
        visible={pendingConfirm !== null}
        title="Confirme o valor digitado"
        message={pendingConfirm != null ? plausibilityConfirmText(pendingConfirm, unit) : ''}
        confirmLabel="O valor está correto"
        cancelLabel="Corrigir"
        onConfirm={() => {
          setPendingConfirm(null)
          void doSave()
        }}
        onCancel={() => setPendingConfirm(null)}
      />
    </Screen>
  )
}
