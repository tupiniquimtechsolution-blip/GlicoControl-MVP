/** Perfil local sincronizado (display_name, unidade, timezone, consentimento). */
import { Db, fromBool, Row, toBool } from '../db/types'
import { GlucoseUnit } from '../../domain/glucose/units'

export type LocalProfile = {
  id: string
  display_name: string | null
  unit: GlucoseUnit
  locale: string
  timezone: string | null
  theme: string
  onboarding_completed: boolean
  consent_at: string | null
}

export class ProfileRepo {
  constructor(private db: Db) {}

  async get(): Promise<LocalProfile | null> {
    const [r] = await this.db.select<Row>('local_profile', { limit: 1 })
    if (!r) return null
    return {
      id: String(r.id), display_name: r.display_name ? String(r.display_name) : null,
      unit: (r.unit as GlucoseUnit) ?? 'mg/dL', locale: String(r.locale ?? 'pt-BR'),
      timezone: r.timezone ? String(r.timezone) : null, theme: String(r.theme ?? 'system'),
      onboarding_completed: toBool(r.onboarding_completed),
      consent_at: r.consent_at ? String(r.consent_at) : null,
    }
  }

  async save(patch: Partial<Pick<LocalProfile, 'display_name' | 'unit' | 'timezone' | 'theme' | 'onboarding_completed'>> & { id: string }): Promise<void> {
    const now = new Date().toISOString()
    const [existing] = await this.db.select<Row>('local_profile', { where: [{ col: 'id', op: '=', value: patch.id }], limit: 1 })
    const row: Row = {
      id: patch.id,
      display_name: patch.display_name ?? existing?.display_name ?? null,
      unit: patch.unit ?? existing?.unit ?? 'mg/dL',
      locale: existing?.locale ?? 'pt-BR',
      timezone: patch.timezone ?? existing?.timezone ?? null,
      theme: patch.theme ?? existing?.theme ?? 'system',
      onboarding_completed: patch.onboarding_completed != null ? fromBool(patch.onboarding_completed) : (existing?.onboarding_completed ?? 0),
      consent_at: existing?.consent_at ?? null,
      consent_version: existing?.consent_version ?? null,
      updated_at: now,
      row_version: Number(existing?.row_version ?? 0) + 1,
      deleted_at: null,
    }
    await this.db.upsert('local_profile', row)
  }

  async setConsent(userId: string, version: string): Promise<void> {
    const [existing] = await this.db.select<Row>('local_profile', { where: [{ col: 'id', op: '=', value: userId }], limit: 1 })
    const now = new Date().toISOString()
    await this.db.upsert('local_profile', {
      id: userId, display_name: existing?.display_name ?? null, unit: existing?.unit ?? 'mg/dL',
      locale: existing?.locale ?? 'pt-BR', timezone: existing?.timezone ?? null,
      theme: existing?.theme ?? 'system', onboarding_completed: existing?.onboarding_completed ?? 0,
      consent_at: existing?.consent_at ?? now, consent_version: version,
      updated_at: now, row_version: Number(existing?.row_version ?? 0) + 1, deleted_at: null,
    })
  }
}
