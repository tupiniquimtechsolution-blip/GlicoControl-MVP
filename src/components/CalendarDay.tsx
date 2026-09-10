import React from 'react'
import { Pressable, Text } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'
import { MonthGridCell } from '../domain/dates/month'
import { dateLongLabelPt } from '../domain/dates/month'

/** Estado textual SEMPRE: contagem "3 medições"/"nenhuma medição" — cor apenas reforça. */
export function CalendarDay({ cell, count, isToday, isFuture, onPress }: { cell: MonthGridCell; count: number | undefined; isToday: boolean; isFuture: boolean; onPress: () => void }) {
  const { theme, t } = useAppTheme()
  const has = (count ?? 0) > 0
  return (
    <Pressable
      onPress={onPress}
      disabled={!cell.inMonth}
      accessibilityRole="button"
      accessibilityLabel={`${dateLongLabelPt(cell.date)}${isToday ? ', hoje' : ''}: ${has ? `${count} mediç${count === 1 ? 'ão' : 'ões'}` : 'nenhuma medição'}${isFuture ? ', futuro' : ''}`}
      style={{
        minHeight: 52,
        borderRadius: t.radius.sm,
        borderWidth: isToday ? 2 : 1,
        borderColor: isToday ? theme.colors.primary : 'transparent',
        backgroundColor: cell.inMonth ? (has ? theme.colors.surfaceAlt : theme.colors.surface) : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 3,
        opacity: cell.inMonth ? 1 : 0.25,
      }}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: t.typography.sizeLabel }}>{cell.dayOfMonth}</Text>
      {cell.inMonth ? (
        <Text style={{ color: has ? theme.colors.primary : theme.colors.textMuted, fontSize: 10 }}>
          {has ? `${count} ✓` : isFuture ? '—' : '0'}
        </Text>
      ) : null}
    </Pressable>
  )
}