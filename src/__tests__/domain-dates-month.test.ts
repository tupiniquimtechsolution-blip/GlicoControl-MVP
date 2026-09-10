import { buildMonthGrid, daysInMonth, isLeapYear, minuteKey, monthKey, shiftMonth, ymd, localToIso, isoToLocal } from '../domain/dates/month'

describe('calendário/datas (§21 do prompt mestre)', () => {
  it('dias do mês: 29 fev bissexto, fevereiro comum, 30/31 dias', () => {
    expect(daysInMonth('2028-02')).toBe(29)
    expect(isLeapYear(2026)).toBe(false)
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2000)).toBe(true)
    expect(daysInMonth('2026-04')).toBe(30)
    expect(daysInMonth('2026-07')).toBe(31)
  })
  it('shiftMonth cruza anos', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2027-01', -1)).toBe('2026-12')
    expect(shiftMonth('2028-01', 1)).toBe('2028-02')
  })
  it('grade sempre 6×7 com transição de mês', () => {
    const g = buildMonthGrid('2026-09')
    expect(g).toHaveLength(42)
    const firstIn = g.findIndex(c => c.inMonth)
    expect(g[firstIn].date).toBe('2026-09-01')
    expect(g[firstIn - 1]?.inMonth).toBe(false)
    expect(g.filter(c => c.inMonth)).toHaveLength(30)
  })
  it('virada do dia: ymd usa hora local (não UTC)', () => {
    const lateNight = new Date(2026, 8, 30, 23, 59, 30)
    expect(ymd(lateNight)).toBe('2026-09-30')
    const nextDay = new Date(2026, 9, 1, 0, 5)
    expect(ymd(nextDay)).toBe('2026-10-01')
    expect(monthKey(lateNight)).toBe('2026-09')
    expect(monthKey(nextDay)).toBe('2026-10')
  })
  it('minuteKey dedupe ignora segundos', () => {
    expect(minuteKey('2026-09-09', '07:00:59')).toBe('202609090700')
    expect(minuteKey('2026-09-09', '07:00:00')).toBe('202609090700')
  })
  it('localToIso/isoToLocal são estáveis por dispositivo', () => {
    const iso = localToIso('2026-09-09', '07:30')
    const back = isoToLocal(iso)
    expect(back.localDate).toBe('2026-09-09')
    expect(back.localTime).toBe('07:30')
  })
})
