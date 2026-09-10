#!/usr/bin/env node
/**
 * Runner de testes SQL do backend com PGlite (Postgres 16 real, sem Docker).
 * Uso: node scripts/rls/run-local.mjs
 * Saída: 'PASS ...' por seção ou erro com a seção que falhou (exit 1).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..')

const { PGlite } = await import('@electric-sql/pglite')
const db = new PGlite()

const migrations = readdirSync(join(repoRoot, 'supabase', 'migrations')).filter(f => f.endsWith('.sql')).sort()
const run = async label => {
  process.stdout.write(`• ${label}  `)
}

try {
  const passRows = res => {
    for (let i = res.length - 1; i >= 0; i--) {
      const row = res[i]?.rows?.[0]
      if (row && (row.pass || row.result)) return row.pass ?? row.result
    }
    return 'ok'
  }

  await run('bootstrap')
  await db.exec(readFileSync(join(repoRoot, 'supabase', 'tests', 'bootstrap.sql'), 'utf8'))
  console.log('ok')

  await run('migrations')
  for (const m of migrations) {
    await db.exec(readFileSync(join(repoRoot, 'supabase', 'migrations', m), 'utf8'))
    process.stdout.write(`[${m.slice(0, 4)}]`)
  }
  console.log(' ok')

  const suiteFiles = ['rls_isolation.sql', 'rpc_privileges.sql']
  const suite = suiteFiles
    .map(file => readFileSync(join(repoRoot, 'supabase', 'tests', file), 'utf8'))
    .join('\n')
  const sections = suite.split(/^--@section\s+/m).slice(1)
  let passCount = 0
  for (const chunk of sections) {
    const nl = chunk.indexOf('\n')
    const name = chunk.slice(0, nl).trim()
    const sql = chunk.slice(nl + 1)
    const res = await db.exec(sql)
    const msg = passRows(res)
    console.log(`• RLS ${name}: ${msg}`)
    passCount++
  }
  console.log(`RLS/SUITE: PASS (${passCount} seções)`)
  await db.close()
  process.exit(0)
} catch (err) {
  console.error('\nRLS/SUITE: FAIL')
  console.error(err?.message ?? err)
  process.exit(1)
}
