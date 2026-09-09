import Constants from 'expo-constants'

/** Somente chaves públicas (anon/publishable). service-role NUNCA entra no app (baseline SECURITY). */
export type SupabaseConfig = { url: string; key: string }

function readEnv(name: string): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>
  const fromExtra = extra[name]
  if (typeof fromExtra === 'string' && fromExtra) return fromExtra
  const env = process.env as Record<string, string | undefined>
  const value = env[name]
  return value && value.length > 0 ? value : undefined
}

export function readSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv('EXPO_PUBLIC_SUPABASE_URL')
  const key = readEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ?? readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) return null
  return { url, key }
}

export const isSupabaseConfigured = () => readSupabaseConfig() !== null
