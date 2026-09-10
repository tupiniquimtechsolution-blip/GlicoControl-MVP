/** Lembretes de medição: lista, ativar/desativar, editar, excluir; reagenda notificações locais. */
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmationDialog } from '../../components/ConfirmationDialog'
import { EmptyState } from '../../components/EmptyState'
import { ReminderCard } from '../../components/ReminderCard'
import { Screen } from '../../components/Screen'
import { useApp } from '../../services/appContext'
import { useAppTheme } from '../../theme/ThemeProvider'
import { useToast } from '../../components/Toast'
import type { Reminder } from '../../services/repositories/reminderRepo'

export default function RemindersScreen() {
  const app = useApp()
  const { theme, t } = useAppTheme()
  const toast = useToast()
  const [items, setItems] = useState<Reminder[] | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const list = await app.reminders.list()
    setItems(list)
    // fonte de verdade do agendador local = lista de lembretes ativos
    if (app.notifications.available) {
      await app.notifications
        .rescheduleAll(
          list
            .filter(r => r.enabled)
            .map(r => ({ id: r.id, label: r.label, schedule: { timeOfDay: r.time_of_day.slice(0, 5), daysOfWeek: r.days_of_week }, snoozeMinutes: r.snooze_minutes }))
        )
        .catch(() => undefined)
    }
  }, [app])

  useEffect(() => {
    void refresh()
  }, [refresh, app.revision])

  const rescheduleHint = app.notifications.available ? 'Os lembretes são agendados neste aparelho; nada é enviado a servidores.' : 'Este ambiente não tem notificações nativas — os horários continuam salvos e aparecem no Início.'

  return (
    <Screen title="Lembretes" subtitle="Leitura de tela: botões abaixo agendam avisos locais no aparelho.">
      <Card>
        <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
          {app.notifications.available ? '🔔 Notificações locais ativadas neste aparelho.' : '🔕 Notificações indisponíveis neste ambiente.'} {rescheduleHint}
        </Text>
      </Card>
      {items === null ? null : items.length === 0 ? (
        <EmptyState
          title="Nenhum lembrete ainda"
          description="Crie lembretes para os horários em que você costuma medir. Você controla dias, horário e snooze."
          actionLabel="Criar lembrete"
          onAction={() => router.push('/reminders-edit' as never)}
        />
      ) : (
        <View style={{ gap: t.spacing.sm }}>
          {items.map(r => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onPress={() => router.push({ pathname: '/reminders-edit', params: { id: r.id } } as never)}
              onToggle={v =>
                void app.reminders.setEnabled(r.id, v).then(() => {
                  app.bump()
                })
              }
            />
          ))}
        </View>
      )}
      <Button label="➕ Criar lembrete" onPress={() => router.push('/reminders-edit' as never)} fullWidth />
      <ConfirmationDialog
        visible={!!deleteId}
        title="Excluir o lembrete selecionado?"
        message="O lembrete some da lista e o agendamento local é cancelado no próximo re-agendamento. As medições já registradas não mudam."
        confirmLabel="Excluir"
        tone="danger"
        onConfirm={() => {
          if (deleteId) void app.reminders.softDelete(deleteId).then(() => { app.bump(); toast.show('Lembrete excluído.') })
          setDeleteId(null)
        }}
        onCancel={() => setDeleteId(null)}
      />
      <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
        Ações ao receber um lembrete: “Registrar agora” abre o registro; “Lembrar depois” adia; “Marcar como realizada” abre o registro com o contexto sugerido. Nenhuma medição é criada automaticamente.
      </Text>
    </Screen>
  )
}