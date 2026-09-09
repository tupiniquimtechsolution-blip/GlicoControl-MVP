/** Gate dos 5 temas: estrutura, contraste de pares de componente, persistência de preferência. */
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'

import { themes, themeOrder, resolveTheme, defaultThemeName } from '../theme/palette'
import { ThemeProvider, useAppTheme } from '../theme/ThemeProvider'
import { Chip } from '../components/Chip'
import { AsyncStorageMock } from '../test/async-storage-mock'

function lum(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

describe('cinco temas baseline', () => {
  it('expõe exatamente os 5 temas, todos com os mesmos 19 tokens', () => {
    expect(Object.keys(themes).sort()).toEqual([...themeOrder].sort())
    const keys = Object.keys(themes[themeOrder[0]].colors)
    expect(keys).toHaveLength(19)
    for (const name of themeOrder) expect(Object.keys(themes[name].colors).sort()).toEqual(keys.sort())
  })
  it('contraste de pares críticos por tema (texto ≥4.5; UI ≥3)', () => {
    for (const name of themeOrder) {
      const c = themes[name].colors
      expect(contrast(c.text, c.background)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c.textMuted, c.surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5)
      // par do chip selecionado: texto sobre secondary (claros) / surfaceAlt (escuros)
      const chipFg = c.text
      const chipBg = themes[name].dark ? c.surfaceAlt : c.secondary
      expect(contrast(chipFg, chipBg)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c.primary, c.surface)).toBeGreaterThanOrEqual(3)
      expect(contrast(c.chart1, c.surface)).toBeGreaterThanOrEqual(3)
      expect(contrast(c.chart2, c.surface)).toBeGreaterThanOrEqual(3)
    }
  })
  it('system resolve para claro (default) ou escuro', () => {
    expect(resolveTheme('system', false).name).toBe(defaultThemeName)
    expect(resolveTheme('system', true).name).toBe('blackWhite')
  })
})

describe('ThemeProvider', () => {
  it('troca o tema ao tocar em um chip dentro do provider e persiste a preferência', async () => {
    function Probe() {
      const { theme, setPreference } = useAppTheme()
      return (
        <>
          <Text testID="name">{theme.name}</Text>
          <Chip label="usar blackYellow" selected={false} onPress={() => setPreference('blackYellow')} />
        </>
      )
    }
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )
    await waitFor(() => expect(getByTestId('name').props.children).toBe('greenWhite'))
    fireEvent.press(getByText('usar blackYellow'))
    await waitFor(() => expect(getByTestId('name').props.children).toBe('blackYellow'))
    await waitFor(async () => expect(AsyncStorageMock.getItem('glicocontrol.theme-preference')).resolves.toBe('blackYellow'))
  })
})
