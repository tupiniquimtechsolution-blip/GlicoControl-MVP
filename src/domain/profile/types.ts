import { GlucoseUnit } from '../glucose/units'
import { ThemePreference } from '../../theme/palette'

export type Profile = {
  id: string
  display_name: string | null
  unit: GlucoseUnit
  locale: string
  timezone: string | null
  theme: ThemePreference
  onboarding_completed: boolean
  consent_at: string | null
  consent_version: string | null
}
