/**
 * Autenticação Supabase (cadastro/login/logout/recuperação) + sessão persistente.
 * Demo local (DEV only): EXPO_PUBLIC_DEMO_MODE=demo-local cria sessão local — NUNCA disponível
 * em produção; serve para desenvolvimento sem credenciais. Todos os dados ficam no aparelho.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Session } from '@supabase/supabase-js'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppState } from 'react-native'

import { CONSENT_VERSION } from '../../domain/legal/texts'
import { getSupabase, mapAuthError } from '../../services/supabase/client'
import { isSupabaseConfigured } from '../../services/supabase/config'
import { useApp } from '../../services/appContext'
import { logEvent } from '../../services/observability/log'

export type AuthUser = { id: string; email: string }
export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'
export type SignUpResult = {
  ok: boolean
  needsEmailConfirmation: boolean
  message: string
}

type AuthApi = {
  user: AuthUser | null
  status: AuthStatus
  authError: string | null
  isDemo: boolean
  clearError: () => void
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, displayName: string, consent: boolean) => Promise<SignUpResult>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>
  acceptConsent: () => Promise<void>
}

const Ctx = createContext<AuthApi | null>(null)
const DEMO_KEY = 'glicocontrol.demo-session'
export const AUTH_REDIRECT_URL = 'glicocontrol://auth-callback'
const demoOn = typeof process !== 'undefined' && process.env.EXPO_PUBLIC_DEMO_MODE === 'demo-local' && !!(__DEV__ ?? false)

function metadataString(session: Session, key: string): string | null {
  const value = session.user.user_metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const app = useApp()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isDemo, setDemo] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const initializeConfirmedProfile = useCallback(async (session: Session) => {
    const userId = session.user.id
    const displayName = metadataString(session, 'display_name')
    const consentVersion = metadataString(session, 'consent_version')
    const consentAccepted = consentVersion === CONSENT_VERSION && session.user.user_metadata?.consent_accepted === true

    // Remove perfil residual de outra conta (versões anteriores não limpavam local_profile no logout).
    for (const row of await app.db.select('local_profile')) {
      if (String(row.id) !== userId) await app.db.deleteById('local_profile', String(row.id))
    }
    // setUserId atualiza a referência síncrona e persiste o meta de forma assíncrona;
    // o primeiro pull precisa do meta já gravado para localizar o profile remoto.
    await app.db.setMeta('user_id', userId)

    if (app.gateway.configured) {
      const remote = await app.gateway.pullProfile(userId).catch(() => null)
      const patch: Record<string, unknown> = {}
      if (!remote?.display_name && displayName && displayName.length >= 2 && displayName.length <= 80) {
        patch.display_name = displayName
      }
      if (!remote?.consent_at && consentAccepted) {
        patch.consent_at = new Date().toISOString()
        patch.consent_version = CONSENT_VERSION
      }
      if (Object.keys(patch).length) await app.gateway.upsertProfile(userId, patch).catch(() => undefined)
      await app.sync.syncNow().catch(() => false)
      return
    }

    // Fallback offline: mantém somente os dados de onboarding necessários no aparelho.
    const local = await app.profile.get()
    if (!local || local.id !== userId) {
      await app.profile.save({
        id: userId,
        display_name: displayName && displayName.length >= 2 && displayName.length <= 80 ? displayName : null,
      })
    }
    if (consentAccepted) await app.profile.setConsent(userId, CONSENT_VERSION)
  }, [app])

  useEffect(() => {
    let cancelled = false
    let unsubscribeAuth: (() => void) | undefined
    let appSub: { remove: () => void } | undefined

    function applySession(session: Session | null) {
      if (cancelled) return
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' })
        app.setUserId(session.user.id)
        setStatus('signed-in')
        void initializeConfirmedProfile(session)
      } else {
        setUser(null)
        app.setUserId(null)
        setStatus('signed-out')
      }
    }

    void (async () => {
      if (demoOn) {
        const stored = await AsyncStorage.getItem(DEMO_KEY)
        if (cancelled) return
        setDemo(true)
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser
          setUser(parsed)
          app.setUserId(parsed.id)
          setStatus('signed-in')
        } else {
          setStatus('signed-out')
        }
        return
      }

      const supabase = getSupabase()
      if (!supabase) {
        if (!cancelled) setStatus('signed-out')
        return
      }

      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      applySession(data.session)

      const authListener = supabase.auth.onAuthStateChange((_ev, session) => applySession(session))
      unsubscribeAuth = () => authListener.data.subscription.unsubscribe()
      appSub = AppState.addEventListener('change', state => {
        if (state === 'active') void supabase.auth.getSession().then(({ data: d }) => applySession(d.session))
      })

      if (cancelled) {
        unsubscribeAuth()
        appSub.remove()
      }
    })()

    return () => {
      cancelled = true
      unsubscribeAuth?.()
      appSub?.remove()
    }
  }, [app, initializeConfirmedProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null)
    if (demoOn) {
      const demo: AuthUser = { id: 'demo-local-user', email: email || 'demo@local' }
      await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(demo))
      setUser(demo)
      app.setUserId(demo.id)
      setStatus('signed-in')
      return true
    }
    const supabase = getSupabase()
    if (!supabase) {
      setAuthError('Backend não configurado. Defina EXPO_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY no .env (ver README).')
      return false
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setAuthError(mapAuthError(error.message))
      return false
    }
    setUser(data.user ? { id: data.user.id, email: data.user.email ?? '' } : null)
    if (data.user) app.setUserId(data.user.id)
    setStatus(data.user ? 'signed-in' : 'signed-out')
    logEvent({ name: 'auth.sign-in', code: 'ok' })
    return !!data.user
  }, [app])

  const acceptConsent = useCallback(async () => {
    if (!user) return
    await app.profile.setConsent(user.id, CONSENT_VERSION)
    if (!isDemo) {
      const supabase = getSupabase()
      if (supabase) {
        await app.gateway.upsertProfile(user.id, { consent_at: new Date().toISOString(), consent_version: CONSENT_VERSION })
      }
    }
  }, [app, user, isDemo])

  const signUp = useCallback(
    async (email: string, password: string, displayName: string, consent: boolean): Promise<SignUpResult> => {
      setAuthError(null)
      if (!consent) {
        const message = 'É necessário aceitar o termo de consentimento para criar a conta.'
        setAuthError(message)
        return { ok: false, needsEmailConfirmation: false, message }
      }
      if (password.length < 8) {
        const message = 'A senha precisa de pelo menos 8 caracteres.'
        setAuthError(message)
        return { ok: false, needsEmailConfirmation: false, message }
      }

      const cleanName = displayName.trim().slice(0, 80)
      if (cleanName && cleanName.length < 2) {
        const message = 'Informe pelo menos 2 caracteres no nome ou deixe o campo vazio.'
        setAuthError(message)
        return { ok: false, needsEmailConfirmation: false, message }
      }

      if (demoOn) {
        const ok = await signIn(email, password)
        if (ok) {
          const id = 'demo-local-user'
          await app.profile.save({ id, display_name: cleanName || null })
          await app.profile.setConsent(id, CONSENT_VERSION)
        }
        return {
          ok,
          needsEmailConfirmation: false,
          message: ok ? 'Conta local de demonstração criada.' : 'Não foi possível criar a conta local.',
        }
      }

      const supabase = getSupabase()
      if (!supabase) {
        const message = 'Backend não configurado. Ver .env (somente chaves públicas).'
        setAuthError(message)
        return { ok: false, needsEmailConfirmation: false, message }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: AUTH_REDIRECT_URL,
          data: {
            display_name: cleanName || null,
            consent_version: CONSENT_VERSION,
            consent_accepted: true,
          },
        },
      })
      if (error) {
        const message = mapAuthError(error.message)
        setAuthError(message)
        return { ok: false, needsEmailConfirmation: false, message }
      }

      if (data.session) {
        return { ok: true, needsEmailConfirmation: false, message: 'Conta criada e sessão iniciada.' }
      }

      return {
        ok: true,
        needsEmailConfirmation: true,
        message: 'Cadastro recebido. Confira seu e-mail e toque no link de confirmação para ativar a conta.',
      }
    },
    [app, signIn]
  )

  const signOut = useCallback(async () => {
    if (!isDemo) {
      const supabase = getSupabase()
      if (supabase) await supabase.auth.signOut().catch(() => undefined)
    } else {
      await AsyncStorage.removeItem(DEMO_KEY)
      setDemo(false)
    }
    await app.sync.wipeLocal().catch(() => undefined)
    setUser(null)
    app.setUserId(null)
    setStatus('signed-out')
    logEvent({ name: 'auth.sign-out' })
  }, [app, isDemo])

  const sendPasswordReset = useCallback(async (email: string) => {
    if (demoOn || !isSupabaseConfigured()) return { ok: false, message: 'Indisponível neste ambiente.' }
    const supabase = getSupabase()!
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: AUTH_REDIRECT_URL })
    if (error) return { ok: false, message: mapAuthError(error.message) }
    return { ok: true, message: 'Se o e-mail estiver cadastrado, você receberá um link de redefinição. Confira a caixa de entrada (e spam).' }
  }, [])

  const value = useMemo<AuthApi>(
    () => ({ user, status, authError, isDemo, clearError: () => setAuthError(null), signIn, signUp, signOut, sendPasswordReset, acceptConsent }),
    [user, status, authError, isDemo, signIn, signUp, signOut, sendPasswordReset, acceptConsent]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth requer AuthProvider')
  return ctx
}
