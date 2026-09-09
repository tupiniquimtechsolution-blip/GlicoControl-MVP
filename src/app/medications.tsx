/** Medicamentos já prescritos (informados pelo usuário), horários e logs de adesão manuais. */
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { ConfirmationDialog } from '../components/ConfirmationDialog'
import { EmptyState } from '../components/EmptyState'
import { Input } from '../components/Input'
import { MedicationCard } from '../components/MedicationCard'
import { Screen } from '../components/Screen'
import { DAY_LABELS_PT_SHORT } from '../domain/reminders/schedule'
import { useToast } from '../components/Toast'
import { useApp } from '../services/appContext'
import { useAppTheme } from '../theme/ThemeProvider'
import type { Medication, MedicationLog, MedicationSchedule } from '../services/repositories/medicationRepo'
import { NumberInput } from '../components/NumberInput'

type List = { medication: Medication; schedules: MedicationSchedule[] }[]

export default function MedicationsScreen() {
  const app = useApp()
  const { theme, t } = useAppTheme()
  const toast = useToast()
  const [list, setList] = useState<List | null>(null)
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [instructions, setInstructions] = useState('')
  const [active, setActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [schedFor, setSchedFor] = useState<string | null>(null)
  const [schedTime, setSchedTime] = useState({ hh: '08', mm: '00' })
  const [schedDays, setSchedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

  const refresh = useCallback(async () => {
    setList(await app.medications.list())
    setLogs(await app.medications.listLogs())
  }, [app])
  useEffect(() => {
    void refresh()
  }, [refresh, app.revision])

  const save = () => {
    setErrors({})
    const done = (errs: Record<string, string>) => {
      if (Object.keys(errs).length) setErrors(errs)
      else {
        app.bump()
        closeForm()
        toast.show(editId ? 'Medicamento atualizado.' : 'Medicamento cadastrado. O app só registra — não calcula nem recomenda doses.')
      }
    }
    if (editId) void app.medications.update(editId, name, dose, instructions || null, active).then(done)
    else void app.medications.create(name, dose, instructions || null).then(res => done(res.errors))
  }

  const openEdit = (m: Medication) => {
    setEditId(m.id)
    setName(m.name)
    setDose(m.dose_text)
    setInstructions(m.instructions ?? '')
    setActive(m.active)
    setFormOpen(true)
  }
  const closeForm = () => {
    setFormOpen(false)
    setEditId(null)
    setName('')
    setDose('')
    setInstructions('')
    setActive(true)
    setErrors({})
    setSchedFor(null)
  }

  return (
    <Screen
      title="Medicamentos"
      subtitle="O app organiza o que VOCÊ registra. Doses são texto livre — sem cálculo, sem recomendação."
    >
      {formOpen ? (
        <Card heading={editId ? 'Editar medicamento' : 'Novo medicamento'} style={{ gap: t.spacing.sm }}>
          <Input testID="medication-name" label="Nome" value={name} onChangeText={setName} error={errors.name} helper="Ex.: Metformina" />
          <Input label="Dose (texto livre)" value={dose} onChangeText={setDose} error={errors.dose} helper="O app não interpreta nem sugere doses." />
          <Input label="Instruções (opcional)" value={instructions} onChangeText={setInstructions} error={errors.instructions} multiline />
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <Button label={active ? '● Ativo' : '○ Inativo'} variant={active ? 'primary' : 'secondary'} onPress={() => setActive(v => !v)} accessibilityHint="Ativa ou pausa os lembretes deste medicamento" />
            <Button label="Cancelar" variant="text" onPress={closeForm} />
            <Button label="Salvar" onPress={save} />
          </View>
        </Card>
      ) : null}

      {schedFor ? (
        <Card heading="Adicionar horário" style={{ gap: t.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <NumberInput label="Hora" value={schedTime.hh} onChangeText={v => setSchedTime(s => ({ ...s, hh: v.slice(0, 2) }))} />
            <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800', paddingBottom: 18 }}>:</Text>
            <NumberInput label="Min" value={schedTime.mm} onChangeText={v => setSchedTime(s => ({ ...s, mm: v.slice(0, 2) }))} />
          </View>
          <View>
            <Text style={{ color: theme.colors.text, fontWeight: '600', marginBottom: 4 }}>Dias</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {DAY_LABELS_PT_SHORT.map((d, i) => (
                <Chip key={`${d}${i}`} label={d} selected={schedDays.includes(i)} onPress={() => setSchedDays(list2 => (list2.includes(i) ? list2.filter(x => x !== i) : [...list2, i].sort()))} />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <Button
              label="Adicionar horário"
              onPress={() =>
                void app.medications
                  .addSchedule(schedFor, `${schedTime.hh.padStart(2, '0')}:${schedTime.mm.padStart(2, '0')}`, schedDays)
                  .then(e => {
                    if (Object.keys(e).length) toast.show(Object.values(e)[0], 'error')
                    else {
                      app.bump()
                      setSchedFor(null)
                    }
                  })
              }
            />
            <Button label="Cancelar" variant="text" onPress={() => setSchedFor(null)} />
          </View>
        </Card>
      ) : null}

      {!list || list.length === 0 ? (
        <EmptyState
          title="Nenhum medicamento cadastrado"
          description="Cadastre os medicamentos que seu profissional de saúde já prescreveu. O app só lembra e registra suas ações."
          actionLabel="Cadastrar medicamento"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <View style={{ gap: t.spacing.sm }}>
          {list.map(({ medication, schedules }) => (
            <View key={medication.id} style={{ gap: 6 }}>
              <MedicationCard
                medication={medication}
                schedules={schedules}
                lastLog={logs.find(l => l.medication_id === medication.id) ?? null}
                onEdit={() => openEdit(medication)}
                onLogAction={a => void app.medications.logAction(medication.id, null, a).then(() => { app.bump(); toast.show(`Ação “${a === 'taken' ? 'Tomei' : a === 'snoozed' ? 'Adiar' : 'Ignorar'}” registrada por você.`) })}
              />
              <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap', paddingLeft: 4 }}>
                <Button label="⏰ + horário" iconOnly={false} variant="text" onPress={() => setSchedFor(medication.id)} />
                <Button label="✏️ editar" variant="text" onPress={() => openEdit(medication)} />
                <Button label="🗑 excluir" variant="text" onPress={() => setConfirmDelete(medication.id)} />
                {schedules.map(s => (
                  <Button
                    key={s.id}
                    label={`remover ${s.time_of_day.slice(0, 5)}`}
                    variant="text"
                    onPress={() => void app.medications.removeSchedule(s.id).then(() => app.bump())}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
      {!formOpen ? <Button label={list?.length ? '➕ Cadastrar outro medicamento' : '➕ Cadastrar medicamento'} onPress={() => setFormOpen(true)} fullWidth /> : null}
      <Card heading="Avisos de adesão" testID="adherence-note">
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
          Os logs abaixo só existem porque VOCÊ tocou nas ações. Um lembrete que chega nunca registra nada sozinho.
        </Text>
        {logs.slice(0, 8).map(l => (
          <Text key={l.id} style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
            • {l.action === 'taken' ? '✓ Tomei' : l.action === 'snoozed' ? '⏰ Adiei' : '— Ignorei'} · {l.logged_at.slice(0, 10)}/{l.logged_at.slice(11, 16)} · {list?.find(x => x.medication.id === l.medication_id)?.medication.name ?? 'medicamento removido'}
          </Text>
        ))}
      </Card>
      <ConfirmationDialog
        visible={!!confirmDelete}
        title="Excluir medicamento?"
        message="O medicamento, seus horários e lembretes locais saem da lista. Os registros de adesão anteriores ficam no histórico até a sincronização aplicá-los como excluídos."
        confirmLabel="Excluir"
        tone="danger"
        onConfirm={() => {
          if (confirmDelete) void app.medications.softDelete(confirmDelete).then(() => { app.bump(); toast.show('Medicamento excluído.') })
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </Screen>
  )
}
