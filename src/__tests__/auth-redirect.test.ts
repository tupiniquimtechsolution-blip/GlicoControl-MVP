import { parseSupabaseAuthError, parseSupabaseAuthRedirect } from '../services/supabase/authRedirect'

describe('Supabase auth mobile redirect', () => {
  it('extrai sessão do fragmento de confirmação', () => {
    expect(parseSupabaseAuthRedirect('glicocontrol://auth-callback#access_token=abc&refresh_token=def&type=signup')).toEqual({
      accessToken: 'abc',
      refreshToken: 'def',
      type: 'signup',
    })
  })

  it('extrai sessão da query de recovery e decodifica valores', () => {
    expect(parseSupabaseAuthRedirect('glicocontrol://auth-callback?access_token=a%2Bb&refresh_token=r%2F1&type=recovery')).toEqual({
      accessToken: 'a+b',
      refreshToken: 'r/1',
      type: 'recovery',
    })
  })

  it('aceita callback canônico com barra final', () => {
    expect(parseSupabaseAuthRedirect('glicocontrol://auth-callback/#access_token=a&refresh_token=b&type=signup')).toEqual({
      accessToken: 'a',
      refreshToken: 'b',
      type: 'signup',
    })
  })

  it('rejeita esquema, host/rota não canônica e payload incompleto', () => {
    expect(parseSupabaseAuthRedirect('https://evil.example/#access_token=a&refresh_token=b')).toBeNull()
    expect(parseSupabaseAuthRedirect('glicocontrol://outro#access_token=a&refresh_token=b')).toBeNull()
    expect(parseSupabaseAuthRedirect('glicocontrol://auth-callback.evil#access_token=a&refresh_token=b')).toBeNull()
    expect(parseSupabaseAuthRedirect('glicocontrol://auth-callback#access_token=a')).toBeNull()
  })

  it('lê erro do redirect sem expor parâmetros como sessão', () => {
    const url = 'glicocontrol://auth-callback#error=access_denied&error_description=Link%20expired'
    expect(parseSupabaseAuthError(url)).toBe('Link expired')
    expect(parseSupabaseAuthRedirect(url)).toBeNull()
  })
})
