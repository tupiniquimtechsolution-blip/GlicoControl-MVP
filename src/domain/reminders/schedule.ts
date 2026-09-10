/** Cálculo puro das próximas ocorrências de um lembrete — testável sem expo-notifications. */
export const DAY_LABELS_PT_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'D'] as const
export const DAY_NAMES_PT = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado',
] as const

export type RecurringSchedule = {
  /** HH:MM */
  timeOfDay: string
  /** índices 0=domingo..6=sábado */
  daysOfWeek: number[]
}

export function nextOccurrences(schedule: RecurringSchedule, from: Date, count: number, maxLookoutDays = 14): Date[] {
  if (!schedule.daysOfWeek.length) return out0
  const [hh, mm] = schedule.timeOfDay.split(':').map(Number)
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return out0
  const days = new Set(schedule.daysOfWeek.filter(d => d >= 0 && d <= 6))
  if (!days.size) return out0
  const out: Date[] = []
  for (let i = 0; i < maxLookoutDays && out.length < count; i++) {
    const d = new Date(from)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    if (!days.has(d.getDay())) continue
    d.setHours(hh, mm, 0, 0)
    if (d.getTime() > from.getTime()) out.push(d)
  }
  return out.slice(0, count)
}
const out0: Date[] = []

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

export function isWeekdaysValid(days: number[]): boolean {
  return Array.isArray(days) && days.length >= 1 && days.length <= 7 && days.every(d => Number.isInteger(d) && d >= 0 && d <= 6) && new Set(days).size === days.length
}

export function normalizeWeekdays(days: number[]): number[] {
  return [...new Set(days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b)
}
