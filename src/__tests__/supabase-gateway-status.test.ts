import { mapSyncUpsertStatus } from '../services/supabase/gateway-impl'

describe('Supabase sync RPC status mapping', () => {
  it('preserva os três estados válidos do contrato de sincronização', () => {
    expect(mapSyncUpsertStatus('applied')).toBe('applied')
    expect(mapSyncUpsertStatus('skipped-stale')).toBe('skipped-stale')
    expect(mapSyncUpsertStatus('parent-missing')).toBe('not-found-parent')
  })

  it.each([
    'table-not-allowed',
    'missing-id',
    'empty-payload',
    'invalid-payload',
    'not-applied',
    null,
    { status: 'applied' },
  ])('falha fechado para resposta RPC inesperada: %p', value => {
    expect(() => mapSyncUpsertStatus(value)).toThrow('sync-upsert-unexpected-status')
  })
})
