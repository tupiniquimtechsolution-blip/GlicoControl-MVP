import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useAppTheme } from '../theme/ThemeProvider'
import { SyncStatusBadge } from './SyncStatusBadge'
import { layout } from '../theme/tokens'

type Props = {
  title: string
  subtitle?: string
  children: React.ReactNode
  scroll?: boolean
  headerRight?: React.ReactNode
  showSync?: boolean
}

export function Screen({ title, subtitle, children, scroll = true, headerRight, showSync = true }: Props) {
  const { theme, t } = useAppTheme()
  const insets = useSafeAreaInsets()
  const content = (
    <View style={{ gap: t.spacing.md, padding: t.spacing.md, maxWidth: layout.webMaxWidth, width: '100%', alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: t.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: t.typography.sizeHeadline, fontWeight: '800', lineHeight: t.typography.sizeHeadline * t.typography.lineHeightTight }}>
            {title}
          </Text>
          {subtitle ? <Text style={{ color: theme.colors.textMuted, fontSize: t.typography.sizeBody, marginTop: 4 }}>{subtitle}</Text> : null}
          {showSync ? <View style={{ marginTop: t.spacing.sm }}><SyncStatusBadge /></View> : null}
        </View>
        {headerRight}
      </View>
      {children}
    </View>
  )
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      {scroll ? <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
    </View>
  )
}
