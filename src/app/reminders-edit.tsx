/** Criar/editar lembrete: nome, horário, dias, snooze; exclusão aqui. */
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { Input } from '../components/Input'
import { NumberInput } from '../components/NumberInput'
import { Screen } from '../components/Screen'
import { DAY_LABELS_PT_SHORT } from '../domain/reminders/schedule'
import { useApp } from '../services/appContext'
import { useToast } from '../components/Toast'
import { useAppTheme } from '../theme/ThemeProvider'

const SNOOZE_OPTIONS = [0, 5, 10, 15, 30, 60]

export default function ReminderEdit() {
  const app = useApp()
  const toast = useToast()
  const { theme, t } = useAppTheme()
  const params = useLocalSearchParams<{ id?: string }>()
  const editingId = params.id ?? null

  const [label, setLabel] = useState('')
  const [hh, setHh] = useState('07')
  const [mm, setMm] = useState('00')
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [snooze, setSnooze] = useState(10)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(!editingId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!editingId) return
    void app.reminders.get(editingId).then(r => {
      if (r) {
        setLabel(r.label)
        const [h, m] = r.time_of_day.split(':')
        setHh(h.padStart(2, '0'))
        setMm(m.slice(0, 2).padStart(2, '0'))
        setDays(r.days_of_week)
        setSnooze(r.snooze_minutes)
      }
      setReady(true)
    })
  }, [app, editingId])

  const draft = { label, time_of_day: `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`, days_of_week: days, snooze_minutes: snooze, enabled: true }

  const save = () => {
    setErrors({})
    const finish = (errs: Record<string, string>) => {
      if (Object.keys(errs).length) setErrors(errs)
      else {
        app.bump()
        toast.show(editingId ? 'Lembrete atualizado.' : 'Lembrete criado. Ele será agendado neste aparelho.')
        router.back()
      }
    }
    if (editingId) void app.reminders.update(editingId, draft).then(finish)
    else void app.reminders.create(draft).then(res => finish(res.errors))
  }

  if (!ready) return <Screen title="Lembrete" scroll={false}><></></Screen>

  return (
    <Screen title={editingId ? 'Editar lembrete' : 'Novo lembrete'} subtitle="Horários ficam salvos neste aparelho e sincronizam como configuração.">
      <Card style={{ gap: t.spacing.md }}>
        <Input testID="reminder-label" label="Nome do lembrete" value={label} onChangeText={v => { setLabel(v); setErrors({}) }} error={errors.label} helper="Ex.: Glicemia antes do café" />
        <View>
          <Text style={{ color: theme.colors.text, fontWeight: '600', marginBottom: 6 }}>Horário</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <NumberInput label="" value={hh} onChangeText={v => setHh(v.slice(0, 2))} error={errors.time_of_day} />
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>:</Text>
            <NumberInput label="" value={mm} onChangeText={v => setMm(v.slice(0, 2))} />
          </View>
        </View>
        <View>
          <Text style={{ color: theme.colors.text, fontWeight: '600', marginBottom: 6 }}>Dias da semana</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {DAY_LABELS_PT_SHORT.map((d, i) => (
              <Chip
                key={`${d}${i}`}
                label={d}
                selected={days.includes(i)}
                onPress={() => setDays(list => (list.includes(i) ? list.filter(x => x !== i) : [...list, i].sort()))}
              />
            ))}
          </View>
          {errors.days ? <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.danger, fontSize: t.typography.sizeCaption }}>⚠ {errors.days}</Text> : null}
        </View>
        <View>
          <Text style={{ color: theme.colors.text, fontWeight: '600', marginBottom: 6 }}>Adiar (snooze) ao tocar em “Lembrar depois”</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {SNOOZE_OPTIONS.map(v => (
              <Chip key={v} size="sm" label={v === 0 ? 'sem snooze' : `${v} min`} selected={snooze === v} onPress={() => setSnooze(v)} />
            ))}
          </View>
        </View>
        <Button label="Salvar" onPress={save} fullWidth />
        {editingId ? (
          <Button label="Excluir lembrete" variant="danger" onPress={() => setConfirmDelete(true)} />
        ) : null}
      </Card>
      <ConfirmationDialog
        visible={confirmDelete}
        title="Excluir este lembrete?"
        message="O agendamento local é cancelado e o lembrete sai da lista."
        confirmLabel="Excluir"
        tone="danger"
        onConfirm={() => {
          if (editingId) void app.reminders.softDelete(editingId).then(() => { app.bump(); toast.show('Lembrete excluído.'); router.back() })
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  )
}
