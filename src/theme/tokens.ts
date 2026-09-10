/** Tokens não-cor do design system (Fase 1 — Foundation). */
import { Platform } from 'react-native'

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const

export const radius = { sm: 8, md: 14, lg: 22, full: 999 } as const

export const typography = {
  sizeCaption: 13,
  sizeBody: 16,
  sizeLabel: 15,
  sizeTitle: 20,
  sizeHeadline: 26,
  sizeDisplay: 40,
  lineHeightTight: 1.15,
  lineHeightBody: 1.45,
} as const

export const touch = {
  /** WCAG/iOS: alvo mínimo de toque 44pt; componentes grandes usam 56. */
  min: 44,
  large: 56,
} as const

export const motion = {
  /** Motion discreto (regra do repo): durações curtas, desativadas com reduceMotion. */
  fast: 120,
  base: 200,
} as const

/** sobreposição de modais — define em tokens (único lugar permitido para valores não-tema;
 *  funciona nos cinco temas pois é neutra com alpha). */
export const overlay = {
  scrim: 'rgba(9,9,11,0.53)',
} as const

export const layout = {
  /** Largura de conteúdo no web preview (desktop); em device é 100%. */
  webMaxWidth: 480,
} as const

export const isWeb = Platform.OS === 'web'
