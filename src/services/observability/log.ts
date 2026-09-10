/**
 * Logger técnico com sanitização por allowlist (baseline SECURITY_PRIVACY.md §Logs).
 * NUNCA registre valores clínicos: medições, nomes/doses de medicamentos, notas, tokens.
 * Somente eventos, tabelas, contagens e códigos de erro.
 */
type Event = { name: string; table?: string; count?: number; code?: string; level?: 'info' | 'warn' | 'error' }

export function logEvent(e: Event) {
  const line = `[glico] ${e.level ?? 'info'} ${e.name}${e.table ? ` table=${e.table}` : ''}${e.count != null ? ` count=${e.count}` : ''}${e.code ? ` code=${e.code}` : ''}`
  if (e.level === 'error') console.warn(line)
  else if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return
  else console.log(line)
}
