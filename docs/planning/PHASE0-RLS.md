# FASE 0 — Estratégia de RLS e Testes de Isolamento

Cobre o item 4 do gate. `AGENTS.md` e `docs/SECURITY_PRIVACY.md`: RLS é obrigatório e
"usuário A não lê/altera/exclui dados de B" deve ser PROVADO por testes — backend não é
considerado pronto sem isso (§16 do prompt mestre).

## 1. Modelo de ameaça relevante para o MVP

- Acesso horizontal entre pacientes (leitura/escrita/edit/deleção cruzada) — **crítico**.
- Acesso `anon` desautenticado às tabelas — **crítico**.
- Referências cruzadas forjadas (log/schedule apontando para fila de outra pessoa) — **alto**.
- Escalação via payload (escrever `user_id` de terceiro em INSERT/UPDATE) — **crítico**.
- Vazamento por service-role no bundle — **crítico** (prevenção: só chaves `EXPO_PUBLIC_*` publishable; secret scan no CI).
- Enumeração por timing/mensagens em auth — atenuado pela config do Supabase + mensagens neutras (Fase 9).

## 2. Política geral (todas as tabelas de dados do paciente)

Para cada tabela `t` de `profiles` (PK=id) e demais (PK=id, FK user_id):

```sql
alter table public.t enable row level security;
-- camada extra defensiva: nunca expor via role anon
revoke all on public.t from anon;
grant select, insert, update, delete on public.t to authenticated;

create policy t_owner_select on public.t for select to authenticated
  using (user_id = auth.uid());
create policy t_owner_insert on public.t for insert to authenticated
  with check (user_id = auth.uid());
create policy t_owner_update on public.t for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy t_owner_delete on public.t for delete to authenticated
  using (user_id = auth.uid());
```

`profiles`: `user_id` é o próprio `id` (`id = auth.uid()`).

Notas:
- `auth.uid()` = `(current_setting('request.jwt.claims', true)::json ->> 'sub')::uuid` — no
  Supabase managed já existe; para Postgres local de testes definimos um stub idêntico
  (ver §5) para que as MESMAS migrations sejam exercitadas fora do serviço.
- Policy com `to authenticated` evita avaliação sob `anon`.
- Deleção de conta = DELETE físico em `auth.users` → cascade remove tudo (LGPD art. 18, eliminação).
  `on delete cascade` nas FKs `user_id`.

## 3. Anti-referência cruzada (padrão FK composto)

Tabelas filhas (`medication_schedules`, `medication_logs`) referenciam pais por
`(medication_id, user_id) → medications (id, user_id)` com `unique (id, user_id)` no pai.
Assim é **impossível** vincular um log a medicamento de outro usuário, mesmo tentando forjar IDs,
porque a FK falha quando `user_id` difere — RLS sozinho não cobre esse vetor.

## 4. Testes de isolamento (obrigatórios; rodam no CI de toda PR da Fase 2+)

Matriz por tabela:

| # | Cenário | Resultado esperado |
| --- | --- | --- |
| T1 | A autentica e `select` da própria linha | ok |
| T2 | A `select` linha de B (por id conhecido) | **0 linhas** |
| T3 | A `insert` com `user_id = B` | **erro (policy)** |
| T4 | A `update` linha de B | **0 rows updated** |
| T5 | A `delete` linha de B | **0 rows deleted** |
| T6 | `anon` (sem JWT) em qualquer tabela/qualquer operação | **erro/permissão negada** |
| T7 | A `insert` filho (`medication_logs`) apontando `medication_id` de B | **erro (FK composto)** |
| T8 | A `update` em `profiles` com id de B | **0 updated** |
| T9 | `authenticated` tenta `grant`/alter table (privilégios) | negado |
| T10 | Usuário autenticado sem linhas | selects retornam `[]`, sem erro |

### Ambiente de execução (realista para este sandbox — medido na auditoria)

Não há Docker nem Supabase local aqui. Estratégia escolhida:

1. **Postgres local via apt** (`postgresql`, servidor na porta do teste) — mesmo motor do
   Supabase Cloud. Instala-se schema mínimo de suporte (`auth.users`, `auth.uid()` stub), roda-se
   `supabase/migrations/*.sql` **sem alteração** (as migrations não dependem de extensões fora de `pg_catalog`/`pgcrypto`), e os testes T1–T10 rodam como scripts SQL psql com asserts:
   `supabase/tests/rls_isolation.sql` → `DO $$ ... raise exception 'FALHA Tn' $$` em qualquer violação; exit code 0 = PASS.
2. **CI (GitHub Actions)** com service container `postgres:15+` executando os mesmos scripts — fonte de verdade portátil.
3. **Fase 2 (real)**: quando houver projeto Supabase provisionado (decisão de custo/credencial = checkpoint humano), repete-se a SUITE contra a instância usando dois JWTs reais, sem alterar os testes.

Requisito de paridade: o stub local de `auth.uid()`/roles (`anon`, `authenticated`, `request.jwt.claims`)
fica documentado em `supabase/tests/README.md`; qualquer divergência detectada no passo 3 é bug de release.

## 5. Segurança além do RLS (baseline `SECURITY_PRIVACY.md`)

- `service_role` apenas em contexto administrativo do painel, **nunca** no app/CI/logs.
- Validação dupla: zod/domain no cliente + constraints no banco (a listadas em `PHASE0-DATA-MODEL.md`).
- `updated_at`/`row_version` atualizados por trigger — o cliente NÃO pode escrever `updated_at`
  (política de update aceita; o trigger sobrescreve → LWW confiável).
- Logs: nenhum SELECT de conteúdo clínico em edge/logging; observabilidade só técnica (§5 de ARCHITECTURE planning).
- Rate limiting: no MVP = proteções da plataforma (Supabase Auth throttles) + dedupe de submit no app;
  documentado como limitação aceita pré-release; revisitado no gate de pentest (Strix, ambiente próprio autorizado).
