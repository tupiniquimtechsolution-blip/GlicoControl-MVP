/** Datas locais do paciente — a chave de calendário/histórico/relatório é SEMPRE o dia local (não o UTC). */

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Chave YYYY-MM para um Date local ou string YYYY-MM(-DD). */
export function monthKey(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 7)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** HH:MM(:SS) a partir de Date local */
export function hms(d: Date, withSeconds = true): string {
  const base = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  return withSeconds ? `${base}:${pad2(d.getSeconds())}` : base
}

export function todayYmd(): string {
  return ymd(new Date())
}

export function nowHm(): string {
  return hms(new Date(), false)
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate() // dia 0 do mês seguinte = último dia
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/** deslocamento de mês preservando o dia quando possível (31 jan + 1 mês = 28/29 fev) */
export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  const ny = Math.floor(total / 12)
  const nm = (total % 12 + 12) % 12
  return `${ny}-${pad2(nm + 1)}`
}

export type MonthGridCell = { date: string; inMonth: boolean; dayOfMonth: number }

/** Grade 6x7 começando no domingo (padrão intl-pt-BR do app; ver teste). */
export function buildMonthGrid(key: string): MonthGridCell[] {
  const [y, m] = key.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const startOffset = first.getDay()
  const cells: MonthGridCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(y, m - 1, 1 - startOffset + i)
    cells.push({ date: ymd(d), inMonth: d.getMonth() === m - 1, dayOfMonth: d.getDate() })
  }
  return cells
}

const WEEKDAYS_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export function weekdayLabelsPt(): string[] {
  return WEEKDAYS_PT
}
export function weekdayIndexPt(d: Date): number {
  return d.getDay()
}

const MONTHS_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
export function monthLabelPt(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS_PT[m - 1]} de ${y}`
}
export function shortMonthLabelPt(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS_PT[m - 1].slice(0, 3)}/${y}`
}

/** data local legível para leitores de tela: "9 de setembro de 2026" */
export function dateLongLabelPt(dateStr: string): string {
  const d = parseYmd(dateStr)
  return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`
}

export function formatDateTimePt(dateStr: string, timeHM: string): string {
  return `${dateStr.split('-').reverse().join('/')} ${timeHM}`
}

/** Lista de chaves YYYY-MM dos últimos n meses (incluindo o atual), mais recente primeiro. */
export function recentMonthKeys(n: number, now = new Date()): string[] {
  const out: string[] = []
  let key = monthKey(now)
  for (let i = 0; i < n; i++) {
    out.push(key)
    key = shiftMonth(key, -1)
  }
  return out
}

/** Combina local_date+local_time+tz_name em ISO absoluto. `tz_name` é metadata (exibição/auditoria);
 *  a reconstrução usa o offset local do dispositivo no momento da operação — suficiente para ordenação estável por aparelho. */
export function localToIso(localDate: string, localTime: string): string {
  const [y, mo, d] = localDate.split('-').map(Number)
  const [h, mi, s = 0] = localTime.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi, s).toISOString()
}

export function isoToLocal(iso: string): { localDate: string; localTime: string } {
  const d = new Date(iso)
  return { localDate: ymd(d), localTime: hms(d, false) }
}

/** minuto de referência para dedupe: YYYYMMDDHHmm */
export function minuteKey(localDate: string, localTime: string): string {
  return `${localDate.replace(/-/g, '')}${localTime.replace(/:/g, '').slice(0, 4)}`
}
