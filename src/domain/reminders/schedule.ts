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
  const out: Date[] = []
  if (!schedule.daysOfWeek.length) return out
  const [hh, mm] = schedule.timeOfDay.split(':').map(Number)
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return out
  const days = new Set(schedule.daysOfWeek.filter(d => d >= 0 && d <= 6))
  if (!days.size) return out
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  for (let i = 0; i < maxLookoutDays * 2 && out.length < count; i++) {
    const day = (cursor.getDay() + Math.floor(i / 2)) % 7
    const d = new Date(cursor)
    d.setDate(cursor.getDate() + Math.floor(i / 2))
    d.setHours(hh, mm, 0, 0)
    if (d.getTime() > from.getTime() && days.has(d.getDay())) out.push(d)
    void day
  }
  return out.sort((a, b) => a.getTime() - b.getTime()).slice(0, count)
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

export function isWeekdaysValid(days: number[]): boolean {
  return Array.isArray(days) && days.length >= 1 && days.length <= 7 && days.every(d => Number.isInteger(d) && d >= 0 && d <= 6) && new Set(days).size === days.length
}

export function normalizeWeekdays(days: number[]): number[] {
  return [...new Set(days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b)
}
