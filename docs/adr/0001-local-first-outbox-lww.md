# ADR 0001 — Local-first com outbox por linha + LWW por `updated_at` proposto

**Status:** aceito (FASE 1). **Data:** 2026-09-09.

## Contexto
O app deve funcionar 100% offline (registrar, consultar, lembrar) e sincronizar com Supabase sem duplicação
e sem backend custom. O celular é fonte de verdade imediata; o servidor é espelho reconciliado.

## Decisão
- Espelho local em SQLite (expo-sqlite) com as mesmas 8 tabelas lógicas do Postgres; driver memória só em testes/web-preview.
- **Outbox por linha** (`sync_outbox`): no máx. 1 pendência por (table,row) — o enqueue substitui o anterior (fila nunca cresce com edições repetidas).
- Push via RPC `sync_upsert_row(table, payload)`/`sync_soft_delete` (`SECURITY DEFINER`, `user_id := auth.uid()` — impossível escrever em outra conta).
- Payload carrega `_proposed_updated_at` = timestamp local da edição. O RPC aplica `WHERE updated_at < $3` (**LWW estrito**): edição antiga de outro dispositivo nunca sobrescreve a nova; `skipped-stale` mantém a fila e o pull seguinte restaura o valor vencedor.
- Pull incremental por `updated_at`; exclusões via `deleted_at` (soft delete; nunca destruição silenciosa).
- Dedupe no minuto+contexto por UNIQUE parcial local e no servidor (migração 0006).

## Consequências
- Sem UI de conflito no MVP: LWW + pull seguinte convergem (testado no harness PGlite seção t-sync e em `sync-engine.test`).
- Relógio do aparelho muito errado pode inverter o LWW — mitigado pela sincronização de relógio do SO e pelo pull sempre reconciliar a tela; aceitável para dados de acompanhamento (não críticos para dosagem).
- O app nunca usa `service_role` (regra de ESLint + secret-scan); a RLS é a única porta no servidor.
