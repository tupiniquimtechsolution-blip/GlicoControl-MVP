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

type AuthApi = {
  user: AuthUser | null
  status: AuthStatus
  authError: string | null
  isDemo: boolean
  clearError: () => void
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, displayName: string, consent: boolean) => Promise<boolean>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>
  acceptConsent: () => Promise<void>
}

const Ctx = createContext<AuthApi | null>(null)
const DEMO_KEY = 'glicocontrol.demo-session'
const demoOn = typeof process !== 'undefined' && process.env.EXPO_PUBLIC_DEMO_MODE === 'demo-local' && !!(__DEV__ ?? false)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const app = useApp()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isDemo, setDemo] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

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
  }, [app])

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
    async (email: string, password: string, displayName: string, consent: boolean) => {
      setAuthError(null)
      if (!consent) {
        setAuthError('É necessário aceitar o termo de consentimento para criar a conta.')
        return false
      }
      if (password.length < 8) {
        setAuthError('A senha precisa de pelo menos 8 caracteres.')
        return false
      }
      if (demoOn) return signIn(email, password)
      const supabase = getSupabase()
      if (!supabase) {
        setAuthError('Backend não configurado. Ver .env (somente chaves públicas).')
        return false
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: displayName.slice(0, 80) } },
      })
      if (error) {
        setAuthError(mapAuthError(error.message))
        return false
      }
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) await acceptConsent()
      return true
    },
    [signIn, acceptConsent]
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
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: 'glicocontrol://reset' })
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
