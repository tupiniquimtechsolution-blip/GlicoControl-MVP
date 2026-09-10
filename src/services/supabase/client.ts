import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

import { readSupabaseConfig } from './config'
import { logEvent } from '../observability/log'

let client: SupabaseClient | null = null

export type SessionUser = { id: string; email: string }

/**
 * Cliente singleton. Sessão persistida via storage adaptador AsyncStorage (padrão oficial RN).
 * PKCE evita transportar access/refresh tokens no deep link de confirmação/recovery:
 * o callback recebe apenas um Auth Code curto e de uso único e faz a troca no mesmo aparelho.
 * Sem service-role. Erros de rede viram `{ error }` — nunca throw sem tratamento na UI.
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client
  const cfg = readSupabaseConfig()
  if (!cfg) return null
  client = createClient(cfg.url, cfg.key, {
    auth: {
      storage: {
        getItem: async (key: string) => AsyncStorage.getItem(key),
        setItem: async (key: string, value: string) => AsyncStorage.setItem(key, value),
        removeItem: async (key: string) => AsyncStorage.removeItem(key),
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  })
  logEvent({ name: 'supabase.client.created' })
  return client
}

export function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already'))
    return 'Não foi possível concluir o cadastro com este e-mail.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'
  if (m.includes('expired') || m.includes('otp_expired') || m.includes('code verifier')) return 'Este link expirou ou não pode mais ser usado. Solicite um novo.'
  if (m.includes('network') || m.includes('failed to fetch')) return 'Sem conexão com o servidor. Verifique a internet.'
  return 'Não foi possível concluir. Tente novamente.'
}
