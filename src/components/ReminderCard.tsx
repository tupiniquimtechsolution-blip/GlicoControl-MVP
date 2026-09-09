import React from 'react'
import { Switch, Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'
import { Card } from './Card'
import { Reminder } from '../services/repositories/reminderRepo'
import { DAY_LABELS_PT_SHORT } from '../domain/reminders/schedule'

export function ReminderCard({ reminder, onToggle, onPress }: { reminder: Reminder; onToggle: (v: boolean) => void; onPress: () => void }) {
  const { theme, t } = useAppTheme()
  const days = reminder.days_of_week.length === 7 ? 'todos os dias' : reminder.days_of_week.map(d => DAY_LABELS_PT_SHORT[d]).join(', ')
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        <Text
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Editar lembrete ${reminder.label}, ${reminder.time_of_day.slice(0, 5)}, ${days}`}
          style={{ flex: 1 }}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: t.typography.sizeTitle }}>{reminder.time_of_day.slice(0, 5)}</Text>
          {'\n'}
          <Text style={{ color: theme.colors.text, fontSize: t.typography.sizeBody }}>{reminder.label}</Text>
          {'\n'}
          <Text style={{ color: reminder.enabled ? theme.colors.textMuted : theme.colors.warning, fontSize: t.typography.sizeCaption }}>
            {reminder.enabled ? `Dias: ${days} · Snooze ${reminder.snooze_minutes} min` : 'Desativado'}
          </Text>
        </Text>
        <Switch
          value={reminder.enabled}
          onValueChange={onToggle}
          accessibilityRole="switch"
          accessibilityLabel={`Ativar ou desativar lembrete ${reminder.label}`}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={theme.colors.surface}
        />
      </View>
    </Card>
  )
}
