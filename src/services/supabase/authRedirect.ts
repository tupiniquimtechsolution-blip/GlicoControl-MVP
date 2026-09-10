export type SupabaseAuthRedirect = {
  accessToken: string
  refreshToken: string
  type: string | null
}

const AUTH_CALLBACK_BASE = 'glicocontrol://auth-callback'

function isCanonicalAuthCallback(url: string): boolean {
  return (
    url === AUTH_CALLBACK_BASE ||
    url === `${AUTH_CALLBACK_BASE}/` ||
    url.startsWith(`${AUTH_CALLBACK_BASE}?`) ||
    url.startsWith(`${AUTH_CALLBACK_BASE}#`) ||
    url.startsWith(`${AUTH_CALLBACK_BASE}/?`) ||
    url.startsWith(`${AUTH_CALLBACK_BASE}/#`)
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

function authParams(url: string): Record<string, string> | null {
  if (!isCanonicalAuthCallback(url)) return null
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
 * Extrai a sessão devolvida pelos links de Auth do Supabase em apps nativos.
 * Suporta fragmento (#access_token=...) e query (?access_token=...) somente no
 * callback canônico do GlicoControl, sem depender de APIs de URL do browser.
 */
export function parseSupabaseAuthRedirect(url: string): SupabaseAuthRedirect | null {
  const params = authParams(url)
  if (!params?.access_token || !params.refresh_token) return null

  return {
    accessToken: params.access_token,
    refreshToken: params.refresh_token,
    type: params.type ?? null,
  }
}

export function parseSupabaseAuthError(url: string): string | null {
  const params = authParams(url)
  return params?.error_description ?? params?.error ?? null
}
