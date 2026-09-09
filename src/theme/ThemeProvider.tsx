/**
 * ThemeProvider real (Fase 1):
 * - consome os 5 temas de `./themes` via tokens semânticos;
 * - persiste preferência em AsyncStorage;
 * - suporta `system` (Appearance do dispositivo);
 * - expõe `useAppTheme()` para TODOS os componentes (proibido cor hardcoded fora de src/theme).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'

import { AppTheme, ThemePreference, resolveTheme, themeOrder } from './palette'
import { motion, radius, spacing, touch, typography } from './tokens'

const STORAGE_KEY = 'glicocontrol.theme-preference'

export type ThemeFonts = { scale: number }

export type AppThemeContextValue = {
  theme: AppTheme
  preference: ThemePreference
  setPreference: (pref: ThemePreference) => void
  /** utilitários prontos do design system */
  t: { spacing: typeof spacing; radius: typeof radius; typography: typeof typography; touch: typeof touch; motion: typeof motion }
  fonts: ThemeFonts
}

const ThemeContext = createContext<AppThemeContextValue | null>(null)

function useSystemDark(): boolean {
  const [scheme, setScheme] = useState<ColorSchemeName>(() => Appearance.getColorScheme() ?? 'light')
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setScheme(colorScheme))
    return () => sub.remove()
  }, [])
  return scheme === 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemDark = useSystemDark()
  const [preference, setPreferenceState] = useState<ThemePreference>('greenWhite')

  useEffect(() => {
    // renderiza imediatamente com o default e aplica a preferência salva quando resolver (sem flash bloqueante)
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored === 'system' || themeOrder.includes(stored as never)) {
          setPreferenceState(stored as ThemePreference)
        }
      })
      .catch(() => undefined)
  }, [])

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref)
    void AsyncStorage.setItem(STORAGE_KEY, pref)
  }, [])

  const theme = useMemo(() => resolveTheme(preference, systemDark), [preference, systemDark])

  const value = useMemo<AppThemeContextValue>(
    () => ({
      theme,
      preference,
      setPreference,
      t: { spacing, radius, typography, touch, motion },
      fonts: { scale: 1 },
    }),
    [theme, preference, setPreference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useAppTheme deve ser usado dentro de <ThemeProvider>')
  return ctx
}


