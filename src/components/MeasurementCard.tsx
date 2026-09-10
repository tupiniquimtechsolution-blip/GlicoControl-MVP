import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useAppTheme } from '../theme/ThemeProvider'
import { Card } from './Card'
import { GlucoseMeasurement } from '../domain/glucose/types'
import { CONTEXT_LABELS_PT } from '../domain/glucose/contexts'
import { formatGlucose, convertGlucose, GlucoseUnit } from '../domain/glucose/units'
import { formatDateTimePt } from '../domain/dates/month'

export function MeasurementCard({
  measurement,
  displayUnit,
  targetBand,
  onPress,
}: {
  measurement: GlucoseMeasurement
  displayUnit: GlucoseUnit
  targetBand?: { min: number | null; max: number | null } | null
  onPress?: () => void
}) {
  const { theme, t } = useAppTheme()
  const shown = convertGlucose(measurement.value, measurement.unit, displayUnit)
  const bandOut =
    targetBand && targetBand.min != null && targetBand.max != null
      ? shown < targetBand.min
        ? 'below'
        : shown > targetBand.max
          ? 'above'
          : null
      : null
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        <View style={{ alignItems: 'center', minWidth: 78 }}>
          <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '800' }} accessibilityLabel={`Glicemia ${formatGlucose(shown, displayUnit)} ${displayUnit}`}>
            {formatGlucose(shown, displayUnit)}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>{displayUnit}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: t.typography.sizeLabel }}>{CONTEXT_LABELS_PT[measurement.context]}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeCaption }}>
            {formatDateTimePt(measurement.local_date, measurement.local_time.slice(0, 5))}
            {measurement.unit !== displayUnit ? ` (registrado em ${measurement.unit})` : ''}
          </Text>
          {measurement.note ? <Text style={{ color: theme.colors.textMuted, fontStyle: 'italic', fontSize: t.typography.sizeCaption }}>“{measurement.note}”</Text> : null}
          {bandOut ? (
            <Text style={{ color: theme.colors.warning, fontSize: t.typography.sizeCaption, fontWeight: '700' }} accessibilityRole="text">
              {bandOut === 'below' ? '▼ Abaixo da sua meta configurada' : '▲ Acima da sua meta configurada'}
            </Text>
          ) : null}
          {measurement.deleted_at === null && measurement.updated_at > new Date(Date.now() - 5000).toISOString() ? (
            <Text style={{ color: theme.colors.info, fontSize: t.typography.sizeCaption }}>💾 Salvo neste aparelho</Text>
          ) : null}
        </View>
        {onPress ? <Text style={{ color: theme.colors.primary, fontSize: 20 }} accessibilityLabel="Abrir medição">›</Text> : null}
      </Card>
    </Pressable>
  )
}
