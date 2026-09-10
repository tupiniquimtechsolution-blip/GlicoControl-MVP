export type AuthCallbackKind = 'confirm' | 'recovery'

export type SupabasePkceRedirect = {
  code: string
}

export const AUTH_CONFIRM_REDIRECT_URL = 'glicocontrol://auth-confirm'
export const AUTH_RECOVERY_REDIRECT_URL = 'glicocontrol://auth-recovery'

function callbackBase(kind: AuthCallbackKind): string {
  return kind === 'confirm' ? AUTH_CONFIRM_REDIRECT_URL : AUTH_RECOVERY_REDIRECT_URL
}

function isCanonicalCallback(url: string, kind: AuthCallbackKind): boolean {
  const base = callbackBase(kind)
  return (
    url === base ||
    url === `${base}/` ||
    url.startsWith(`${base}?`) ||
    url.startsWith(`${base}#`) ||
    url.startsWith(`${base}/?`) ||
    url.startsWith(`${base}/#`)
  )
}

function decodePart(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

function parseParams(part: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const item of part.split('&')) {
    if (!item) continue
    const eq = item.indexOf('=')
    const rawKey = eq >= 0 ? item.slice(0, eq) : item
    const rawValue = eq >= 0 ? item.slice(eq + 1) : ''
    out[decodePart(rawKey)] = decodePart(rawValue)
  }
  return out
}

function authParams(url: string, kind: AuthCallbackKind): Record<string, string> | null {
  if (!isCanonicalCallback(url, kind)) return null
  const hashIndex = url.indexOf('#')
  const queryIndex = url.indexOf('?')
  const raw = hashIndex >= 0
    ? url.slice(hashIndex + 1)
    : queryIndex >= 0
      ? url.slice(queryIndex + 1)
      : ''
  return parseParams(raw)
}

/**
 * PKCE: o deep link aceita apenas o Auth Code de uso único. Access/refresh tokens
 * nunca são lidos do URL e só são obtidos após exchangeCodeForSession no aparelho
 * que iniciou o fluxo e possui o code verifier correspondente.
 */
export function parseSupabasePkceRedirect(url: string, kind: AuthCallbackKind): SupabasePkceRedirect | null {
  const params = authParams(url, kind)
  if (!params?.code) return null
  return { code: params.code }
}

export function parseSupabaseAuthError(url: string, kind: AuthCallbackKind): string | null {
  const params = authParams(url, kind)
  return params?.error_description ?? params?.error ?? null
}
