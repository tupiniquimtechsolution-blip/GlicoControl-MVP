import {
  AUTH_CONFIRM_REDIRECT_URL,
  AUTH_RECOVERY_REDIRECT_URL,
  parseSupabaseAuthError,
  parseSupabasePkceRedirect,
} from '../services/supabase/authRedirect'

describe('Supabase Auth mobile PKCE redirect', () => {
  it('extrai apenas o Auth Code do callback de confirmação', () => {
    expect(parseSupabasePkceRedirect(`${AUTH_CONFIRM_REDIRECT_URL}?code=abc-123`, 'confirm')).toEqual({ code: 'abc-123' })
  })

  it('extrai e decodifica o Auth Code do callback de recovery', () => {
    expect(parseSupabasePkceRedirect(`${AUTH_RECOVERY_REDIRECT_URL}?code=a%2Bb%2F1`, 'recovery')).toEqual({ code: 'a+b/1' })
  })

  it('aceita callback canônico com barra final', () => {
    expect(parseSupabasePkceRedirect(`${AUTH_CONFIRM_REDIRECT_URL}/?code=abc`, 'confirm')).toEqual({ code: 'abc' })
  })

  it('não mistura callback de confirmação com recovery', () => {
    expect(parseSupabasePkceRedirect(`${AUTH_RECOVERY_REDIRECT_URL}?code=abc`, 'confirm')).toBeNull()
    expect(parseSupabasePkceRedirect(`${AUTH_CONFIRM_REDIRECT_URL}?code=abc`, 'recovery')).toBeNull()
  })

  it('rejeita esquema/host não canônico, lookalike e payload sem code', () => {
    expect(parseSupabasePkceRedirect('https://evil.example/?code=abc', 'confirm')).toBeNull()
    expect(parseSupabasePkceRedirect('glicocontrol://outro?code=abc', 'confirm')).toBeNull()
    expect(parseSupabasePkceRedirect('glicocontrol://auth-confirm.evil?code=abc', 'confirm')).toBeNull()
    expect(parseSupabasePkceRedirect(AUTH_CONFIRM_REDIRECT_URL, 'confirm')).toBeNull()
  })

  it('não aceita access/refresh tokens do antigo fluxo implícito', () => {
    const implicit = `${AUTH_CONFIRM_REDIRECT_URL}#access_token=secret-access&refresh_token=secret-refresh`
    expect(parseSupabasePkceRedirect(implicit, 'confirm')).toBeNull()
  })

  it('lê erro apenas do callback esperado', () => {
    const url = `${AUTH_RECOVERY_REDIRECT_URL}?error=access_denied&error_description=Link%20expired`
    expect(parseSupabaseAuthError(url, 'recovery')).toBe('Link expired')
    expect(parseSupabaseAuthError(url, 'confirm')).toBeNull()
  })
})
