/**
 * Agendador local de lembretes (expo-notifications).
 * - JAMAIS registra ações automaticamente: notificação que chega não vira log.
 * - Ações no toast: glicemia (Registrar agora / Lembrar depois / Marcar realizada) e
 *   medicação (Tomei / Adiar / Ignorar) — cada uma exige toque do usuário.
 * - Re-empurra ocorrências futuras em toda abertura do app (padrão para notificações
 *   locais agendadas por calendário, sem servidor de push no MVP).
 * - Fora de um build de desenvolvimento (Expo Go/web) entra em modo "indisponível"
 *   com aviso na UI — nunca quebra o restante do app.
 */
import { addMinutes, nextOccurrences, RecurringSchedule } from '../../domain/reminders/schedule'

export const CATEGORY_GLUCOSE = 'glico-glucose-reminder'
export const CATEGORY_MEDICATION = 'glico-medication-reminder'
export const CHANNEL_ID = 'glicocontrol-reminders'

export type NotificationActionId = 'glico.register_now' | 'glico.snooze' | 'glico.mark_done' | 'glico.took' | 'glico.skip'
export type ScheduledNotification = {
  notificationId: string
  kind: 'glucose' | 'medication'
  refId: string
  at: string
}

export interface NotifScheduler {
  available: boolean
  permission(): Promise<'granted' | 'denied' | 'unavailable'>
  rescheduleAll(items: { id: string; label: string; schedule: RecurringSchedule; snoozeMinutes: number }[]): Promise<ScheduledNotification[]>
  cancelAll(): Promise<void>
  snooze(refId: string, minutes: number): Promise<void>
}

/** cálculo puro de quantas ocorrências manter agendadas (janela de 14 dias, máx. 40 por lembrete) */
export function occurrencesToSchedule(schedule: RecurringSchedule, from: Date): Date[] {
  return nextOccurrences(schedule, from, 40, 14)
}

export const snoozeDate = (from: Date, minutes: number) => addMinutes(from, minutes)

let expoNotifications: typeof import('expo-notifications') | null = null
try {
  // require dinâmico: em ambientes sem o módulo nativo (web/teste) o wrapper degrada com aviso
  expoNotifications = require('expo-notifications')
} catch {
  expoNotifications = null
}

export function createNotificationScheduler(): NotifScheduler {
  const hasNative = !!expoNotifications && expoNotifications.getExpoPushTokenAsync !== undefined
  let scheduled: ScheduledNotification[] = []

  const noop: NotifScheduler = {
    available: false,
    async permission() {
      return 'unavailable'
    },
    async rescheduleAll(items) {
      const now = new Date()
      scheduled = items.flatMap(item =>
        occurrencesToSchedule(item.schedule, now)
          .slice(0, 7)
          .map(d => ({ notificationId: `${item.id}:${d.toISOString()}`, kind: 'glucose', refId: item.id, at: d.toISOString() }))
      )
      return scheduled
    },
    async cancelAll() {
      scheduled = []
    },
    async snooze() {},
  }
  if (!hasNative) return noop

  const N = expoNotifications!

  async function scheduleAt(date: Date, title: string, body: string, category: string, data: Record<string, unknown>) {
    await N.scheduleNotificationAsync({
      content: { title, body, sound: 'default', data },
      trigger: { type: 'date', date } as never,
    })
  }

  return {
    available: true,
    async permission() {
      const { status } = await N.getPermissionsAsync()
      if (status === 'granted') return 'granted'
      const req = await N.requestPermissionsAsync()
      return req.status === 'granted' ? 'granted' : 'denied'
    },
    async rescheduleAll(items) {
      await this.cancelAll()
      const now = new Date()
      const out: ScheduledNotification[] = []
      for (const item of items) {
        for (const d of occurrencesToSchedule(item.schedule, now).slice(0, 7)) {
          await scheduleAt(
            d,
            item.label,
            'Toque para registrar sua medição. Nada é preenchido automaticamente.',
            CATEGORY_GLUCOSE,
            { kind: 'glucose', refId: item.id }
          )
          out.push({ notificationId: 'expo', kind: 'glucose', refId: item.id, at: d.toISOString() })
        }
      }
      scheduled = out
      return out
    },
    async cancelAll() {
      await N.cancelAllScheduledNotificationsAsync()
      scheduled = []
    },
    async snooze(refId, minutes) {
      const item = scheduled.find(s => s.refId === refId)
      void item
      await scheduleAt(snoozeDate(new Date(), minutes), 'Lembrete adiado', 'Retomando seu lembrete em alguns minutos.', CATEGORY_GLUCOSE, { kind: 'glucose', refId })
    },
  }
}

/** tratamento de resposta à notificação (executado quando o app abre pelo toque) */
export function handleNotificationResponse(
  response: { actionIdentifier?: string; notification: { request: { content: { data?: Record<string, unknown> } } } },
  handlers: { onRegisterNow: (refId: string) => void; onSnooze: (refId: string, minutes: number) => void; onMarkDone: (refId: string) => void; onMedicationAction?: (medicationId: string, action: 'taken' | 'snoozed' | 'skipped') => void }
): void {
  const data = response.notification.request.content.data ?? {}
  const refId = String(data.refId ?? '')
  const kind = String(data.kind ?? 'glucose')
  const action = response.actionIdentifier ?? 'default'
  if (kind === 'medication' && handlers.onMedicationAction) {
    if (action === 'glico.took') handlers.onMedicationAction(refId, 'taken')
    else if (action === 'glico.snooze') handlers.onMedicationAction(refId, 'snoozed')
    else if (action === 'glico.skip') handlers.onMedicationAction(refId, 'skipped')
    return
  }
  if (action === 'glico.register_now' || action === 'default') handlers.onRegisterNow(refId)
  else if (action === 'glico.snooze') handlers.onSnooze(refId, 10)
  else if (action === 'glico.mark_done') handlers.onMarkDone(refId)
}
