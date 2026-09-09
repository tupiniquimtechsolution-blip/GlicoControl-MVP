#!/usr/bin/env bash
# Executa migrations + testes de RLS contra Postgres real.
# Ordem: bootstrap (roles/auth) → migrations → testes. Usa PGlite via Node se não houver psql/PG.
set -euo pipefail
cd "$(dirname "$0")/../.."
exec node scripts/rls/run-local.mjs "$@"
