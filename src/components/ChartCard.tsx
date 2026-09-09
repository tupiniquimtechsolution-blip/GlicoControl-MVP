/** Renderização RN dos chart-specs (SVG nativo). Mesma spec gera o SVG do PDF → paridade garantida por teste. */
import React from 'react'
import { Text, View } from 'react-native'
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg'

import { BarsChartSpec, LineChartSpec } from '../domain/reports/chart-spec'
import { useAppTheme } from '../theme/ThemeProvider'
import { Card } from './Card'

export function LineChartView({ spec, caption }: { spec: LineChartSpec; caption: string }) {
  const { theme } = useAppTheme()
  const { width, height, points, xTicks, padTop, padBottom, padX, bands } = spec
  const path = points.length ? `M ${points.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}` : ''
  return (
    <View accessibilityLabel={`Gráfico: ${caption}. ${points.length ? points.map(p => p.aria).join('; ') : 'Sem dados.'}`}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {bands ? <Rect x={padX} y={Math.min(bands.from, bands.to)} width={width - padX * 2} height={Math.abs(bands.to - bands.from)} fill={theme.colors.success} opacity={0.12} /> : null}
        <Line x1={padX} y1={height - padBottom} x2={width - padX} y2={height - padBottom} stroke={theme.colors.border} strokeWidth={1} />
        <Line x1={padX} y1={padTop} x2={padX} y2={height - padBottom} stroke={theme.colors.border} strokeWidth={1} />
        <SvgText x={padX - 6} y={padTop + 4} fontSize={10} textAnchor="end" fill={theme.colors.textMuted}>{spec.yMax}</SvgText>
        <SvgText x={padX - 6} y={height - padBottom} fontSize={10} textAnchor="end" fill={theme.colors.textMuted}>{spec.yMin}</SvgText>
        {path ? <Path d={path} stroke={theme.colors.chart1} strokeWidth={2} fill="none" /> : null}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.4} fill={theme.colors.chart1} />
        ))}
        {xTicks.map((tk, i) => (
          <SvgText key={i} x={tk.x} y={height - 8} fontSize={10} textAnchor="middle" fill={theme.colors.textMuted}>{tk.label}</SvgText>
        ))}
      </Svg>
      <Text style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 4 }}>{caption}</Text>
    </View>
  )
}

export function BarsChartView({ spec, caption }: { spec: BarsChartSpec; caption: string }) {
  const { theme, t } = useAppTheme()
  const n = Math.max(1, spec.bars.length)
  const inner = spec.width - 88
  const bw = Math.min(64, inner / n - 12)
  return (
    <View accessibilityLabel={`Gráfico de barras: ${caption}. ${spec.bars.map(b => `${b.label}: ${b.value}`).join('; ')}.`}>
      <Svg width="100%" height={spec.height} viewBox={`0 0 ${spec.width} ${spec.height}`}>
        <Line x1={44} y1={spec.height - 24} x2={spec.width - 44} y2={spec.height - 24} stroke={theme.colors.border} />
        {spec.bars.map((b, i) => {
          const h = Math.max(2, b.pct * (spec.height - 44))
          const x = 44 + (inner / n) * i + (inner / n - bw) / 2
          const y = spec.height - 24 - h
          return (
            <React.Fragment key={b.label}>
              <Rect x={x} y={y} width={bw} height={h} fill={theme.colors.chart2} />
              <SvgText x={x + bw / 2} y={y - 4} fontSize={10} textAnchor="middle" fill={theme.colors.text}>{b.value}</SvgText>
              <SvgText x={x + bw / 2} y={spec.height - 10} fontSize={9} textAnchor="middle" fill={theme.colors.textMuted}>{b.label.replace(/^(Antes|Depois) do /, '')}</SvgText>
            </React.Fragment>
          )
        })}
      </Svg>
      <Text style={{ fontSize: t.typography.sizeCaption, color: theme.colors.textMuted, marginTop: 4 }}>{caption}</Text>
    </View>
  )
}

export function ChartCard({ heading, children }: { heading: string; children: React.ReactNode }) {
  const { theme, t } = useAppTheme()
  return (
    <Card heading={heading}>
      <View style={{ gap: t.spacing.xs }}>{children}</View>
    </Card>
  )
}