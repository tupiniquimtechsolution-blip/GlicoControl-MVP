import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'
import { Card } from './Card'
import { Medication, MedicationSchedule, LOG_ACTION_LABELS, MedicationLog } from '../services/repositories/medicationRepo'
import { formatDateTimePt } from '../domain/dates/month'

export function MedicationCard({
  medication,
  schedules,
  onEdit,
  onLogAction,
  lastLog,
}: {
  medication: Medication
  schedules: MedicationSchedule[]
  onEdit: () => void
  onLogAction: (action: MedicationLog['action']) => void
  lastLog?: MedicationLog | null
}) {
  const { theme, t } = useAppTheme()
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.spacing.sm }}>
        <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Editar medicamento ${medication.name}, dose registrada ${medication.dose_text}`} style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: t.typography.sizeTitle }}>{medication.name}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeBody }}>Dose registrada por você: {medication.dose_text}</Text>
          {medication.instructions ? <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption, fontStyle: 'italic' }}>{medication.instructions}</Text> : null}
          <Text style={{ color: medication.active ? theme.colors.success : theme.colors.warning, fontSize: t.typography.sizeCaption, fontWeight: '600', marginTop: 2 }}>
            {medication.active ? '● Ativo' : '○ Inativo'}
            {schedules.length ? ` · ${schedules.map(s => s.time_of_day.slice(0, 5)).join(', ')}` : ' · sem horários'}
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap' }}>
        {(['taken', 'snoozed', 'skipped'] as const).map(a => (
          <Pressable
            key={a}
            accessibilityRole="button"
            accessibilityLabel={`Registrar: ${LOG_ACTION_LABELS[a]}`}
            onPress={() => onLogAction(a)}
            style={{ minHeight: t.touch.min, paddingHorizontal: t.spacing.md, borderRadius: t.radius.full, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{a === 'taken' ? '✓ ' : a === 'snoozed' ? '⏰ ' : '— '} {LOG_ACTION_LABELS[a]}</Text>
          </Pressable>
        ))}
      </View>
      {lastLog ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
          Último registro manual: {LOG_ACTION_LABELS[lastLog.action]} em {formatDateTimePt(lastLog.logged_at.slice(0, 10), lastLog.logged_at.slice(11, 16))}
        </Text>
      ) : (
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>Nenhum registro de adesão ainda — nada é marcado automaticamente.</Text>
      )}
    </Card>
  )
}
