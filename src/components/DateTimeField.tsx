/**
 * Campo de data/hora acessível e tematizável (sem spinner nativo que ignora tema e falha
 * em leitura de tela): dia/mês/ano + hora/minuto validados + atalho "Agora".
 * Retorna datas locais estáveis (YYYY-MM-DD / HH:MM), independentes do fuso do instante.
 */
import React, { useMemo } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

import { daysInMonth, todayYmd, nowHm } from '../domain/dates/month'
import { useAppTheme } from '../theme/ThemeProvider'

type Props = {
  localDate: string // YYYY-MM-DD
  localTime: string // HH:MM
  onChange: (date: string, time: string) => void
  label?: string
}

const Cell = ({ value, onChange, max, label }: { value: string; onChange: (v: string) => void; max: number; label: string }) => {
  const { theme, t } = useAppTheme()
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <TextInput
        value={value}
        onChangeText={v => onChange(v.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        maxLength={String(max).length}
        accessibilityLabel={label}
        accessibilityValue={{ text: `${value} ${label.toLowerCase()}` }}
        style={{
          minWidth: 56,
          minHeight: t.touch.min,
          textAlign: 'center',
          fontSize: t.typography.sizeTitle,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: t.radius.sm,
          padding: t.spacing.xs,
        }}
      />
      <Text style={{ fontSize: t.typography.sizeCaption, color: theme.colors.textMuted }}>{label}</Text>
    </View>
  )
}

export function DateTimeField({ localDate, localTime, onChange, label = 'Data e hora da medição' }: Props) {
  const { theme, t } = useAppTheme()
  const parts = useMemo(() => {
    const [y, m, d] = localDate.split('-')
    const [hh, mm] = localTime.split(':')
    return { y: y ?? '', m: m ?? '', d: d ?? '', hh: hh ?? '00', mm: mm ?? '00' }
  }, [localDate, localTime])

  const commit = (next: Partial<typeof parts>) => {
    const y = next.y ?? parts.y
    const m = next.m ?? parts.m
    const d = next.d ?? parts.d
    const hh = (next.hh ?? parts.hh).padStart(2, '0').slice(-2)
    const mm = (next.mm ?? parts.mm).padStart(2, '0').slice(-2)
    const dim = daysInMonth(`${y}-${m.padStart(2, '0')}`)
    const dd = Math.min(Number(d || '1') || 1, dim)
    const valid = y.length === 4 && Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= dim
    const newDate = valid ? `${y}-${m.padStart(2, '0')}-${String(dd).padStart(2, '0')}` : localDate
    const timeOk = Number(hh) <= 23 && Number(mm) <= 59
    onChange(newDate, timeOk ? `${hh}:${mm}` : localTime)
  }

  return (
    <View style={{ gap: 6 }} accessibilityLabel={label}>
      <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: t.typography.sizeLabel }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: t.spacing.xs + 2, flexWrap: 'wrap' }}>
        <Cell value={parts.d} onChange={v => commit({ d: v })} max={31} label="Dia" />
        <Cell value={parts.m} onChange={v => commit({ m: v })} max={12} label="Mês" />
        <Cell value={parts.y} onChange={v => commit({ y: v })} max={9999} label="Ano" />
        <View style={{ width: t.spacing.sm }} />
        <Cell value={parts.hh} onChange={v => commit({ hh: v })} max={23} label="Hora" />
        <Text style={{ fontSize: t.typography.sizeTitle, color: theme.colors.text, alignSelf: 'flex-start', marginTop: 10 }}>:</Text>
        <Cell value={parts.mm} onChange={v => commit({ mm: v })} max={59} label="Min" />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            const now = new Date()
            onChange(todayYmd(), nowHm())
            void now
          }}
          style={{ minHeight: t.touch.min, justifyContent: 'center', paddingHorizontal: t.spacing.sm, borderRadius: t.radius.full, borderWidth: 1, borderColor: theme.colors.primary }}
        >
          <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Agora</Text>
        </Pressable>
      </View>
    </View>
  )
}
