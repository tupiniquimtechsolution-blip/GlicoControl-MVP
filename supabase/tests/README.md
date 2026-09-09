# Testes de banco (RLS, triggers, sync RPC)

Executam o MESMO SQL das migrations contra um Postgres real (PGlite/PG16 no sandbox e
CI com service container `postgres:16`). O bootstrap recria os primitivos que o
Supabase provê (`roles anon/authenticated`, `auth.users`, `auth.uid()` via
`request.jwt.claims`), permitindo testar as policies sem credenciais externas.

- `bash scripts/rls/run-local.sh` → aplica migrations + `rls_isolation.sql` e falha com exit≠0.
- Cobertura obrigatória: T1–T10 (isolamento), T-COVERAGE (RLS habilitado em TODAS as tabelas),
  T-TRIGGER, T-DEDUP, T-SYNC (LWW/soft-delete/owner-forjado/FK), T-DELETE-OWN.
