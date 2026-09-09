/**
 * Acesso ao palette dos cinco temas baseline.
 * `src/theme/themes.ts` é o arquivo de origem versionado no bootstrap do repo —
 * nunca editar cores aqui sem decisão documentada (docs/THEME_SYSTEM.md).
 */
import { AppTheme, ThemeName, themes, defaultThemeName } from './themes'

export type { AppTheme, ThemeName }
export { themes, defaultThemeName }

/** Preferência persistida: além dos 5 temas, `system` resolve via colorScheme do SO. */
export type ThemePreference = ThemeName | 'system'

export const themeOrder: ThemeName[] = [
  'pastelCalm',
  'greenWhite',
  'yellowWhite',
  'blackWhite',
  'blackYellow',
]

export const themeLabelsPt: Record<ThemeName, string> = {
  pastelCalm: 'Pastel Calm',
  greenWhite: 'Verde / Branco',
  yellowWhite: 'Amarelo / Branco',
  blackWhite: 'Preto / Branco',
  blackYellow: 'Preto / Amarelo',
}

export function resolveTheme(pref: ThemePreference, systemDark: boolean): AppTheme {
  const name: ThemeName = pref === 'system' ? (systemDark ? 'blackWhite' : defaultThemeName) : pref
  return themes[name]
}
