export type ThemeName =
  | 'pastelCalm'
  | 'greenWhite'
  | 'yellowWhite'
  | 'blackWhite'
  | 'blackYellow'

export type AppTheme = {
  name: ThemeName
  dark: boolean
  colors: {
    background: string
    surface: string
    surfaceAlt: string
    primary: string
    onPrimary: string
    secondary: string
    accent: string
    text: string
    textMuted: string
    border: string
    success: string
    warning: string
    danger: string
    info: string
    focusRing: string
    chart1: string
    chart2: string
    chart3: string
    chart4: string
  }
}

export const themes: Record<ThemeName, AppTheme> = {
  pastelCalm: {
    name: 'pastelCalm',
    dark: false,
    colors: {
      background: '#FFFDF8',
      surface: '#FFFFFF',
      surfaceAlt: '#F2F7F3',
      primary: '#4F7D64',
      onPrimary: '#FFFFFF',
      secondary: '#A8D5BA',
      accent: '#E7B97D',
      text: '#26332C',
      textMuted: '#66736C',
      border: '#DDE8E1',
      success: '#4F7D64',
      warning: '#9A6B00',
      danger: '#A84D4D',
      info: '#536F98',
      focusRing: '#536F98',
      chart1: '#4F7D64',
      chart2: '#9A6B00',
      chart3: '#536F98',
      chart4: '#8A5E78',
    },
  },
  greenWhite: {
    name: 'greenWhite',
    dark: false,
    colors: {
      background: '#F7FBF8',
      surface: '#FFFFFF',
      surfaceAlt: '#EAF5EF',
      primary: '#236B4A',
      onPrimary: '#FFFFFF',
      secondary: '#BFE3CF',
      accent: '#4C9B74',
      text: '#173428',
      textMuted: '#5D7167',
      border: '#D4E6DC',
      success: '#236B4A',
      warning: '#8A6500',
      danger: '#A53F3F',
      info: '#326A91',
      focusRing: '#326A91',
      chart1: '#236B4A',
      chart2: '#397D5A',
      chart3: '#326A91',
      chart4: '#8A6500',
    },
  },
  yellowWhite: {
    name: 'yellowWhite',
    dark: false,
    colors: {
      background: '#FFFDF5',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF7D6',
      primary: '#8A6200',
      onPrimary: '#FFFFFF',
      secondary: '#FFD85A',
      accent: '#E7B600',
      text: '#332B16',
      textMuted: '#70664D',
      border: '#E9DFC2',
      success: '#376E4D',
      warning: '#8A6200',
      danger: '#A5453D',
      info: '#406C8C',
      focusRing: '#406C8C',
      chart1: '#8A6200',
      chart2: '#376E4D',
      chart3: '#406C8C',
      chart4: '#8A4E68',
    },
  },
  blackWhite: {
    name: 'blackWhite',
    dark: true,
    colors: {
      background: '#0B0B0C',
      surface: '#171719',
      surfaceAlt: '#212124',
      primary: '#F7F7F8',
      onPrimary: '#111113',
      secondary: '#D7D7DB',
      accent: '#FFFFFF',
      text: '#F7F7F8',
      textMuted: '#B8B8BE',
      border: '#343438',
      success: '#83C99F',
      warning: '#F0C969',
      danger: '#F08A8A',
      info: '#8EB9E1',
      focusRing: '#F7F7F8',
      chart1: '#F7F7F8',
      chart2: '#B8B8BE',
      chart3: '#83C99F',
      chart4: '#F0C969',
    },
  },
  blackYellow: {
    name: 'blackYellow',
    dark: true,
    colors: {
      background: '#0B0B0C',
      surface: '#171719',
      surfaceAlt: '#242117',
      primary: '#FFD54F',
      onPrimary: '#17130A',
      secondary: '#FFE79A',
      accent: '#FFC928',
      text: '#FFFFFF',
      textMuted: '#C7C7CC',
      border: '#453D24',
      success: '#8FC8A2',
      warning: '#FFD54F',
      danger: '#F28D86',
      info: '#94BCE0',
      focusRing: '#FFD54F',
      chart1: '#FFD54F',
      chart2: '#8FC8A2',
      chart3: '#94BCE0',
      chart4: '#F0A1C1',
    },
  },
}

export const defaultThemeName: ThemeName = 'greenWhite'
