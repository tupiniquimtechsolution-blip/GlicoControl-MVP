# FASE 0 — Estratégia Offline e Sincronização

Cobre o item 5 do gate. Requisitos mínimos (§20 do prompt mestre): registrar glicemia offline,
consultar histórico recente, receber lembretes locais; ao reconectar, sincronizar **sem perda,
sem duplicação e com conflitos resolvidos deterministicamente**.

## 1. Decisão

**SQLite local como fonte de leitura da UI + fila de saída (outbox) + reconciliação puxada do
servidor, com last-write-wins por linha baseado em `updated_at` canônico do servidor.**

- Persistência: `expo-sqlite` (nativo no Expo, sem dependência de terceiros além do SDK, funciona offline sem permissão de rede).
- Toda tela lê do espelho local (nunca do Supabase diretamente na renderização); escrita =
  transação local + op no outbox; `services/sync/` drena o outbox quando online.
- Simples o suficiente para o MVP e reversível (nenhuma tela conhece o mecanismo: tudo via repositórios).

Rejeitados: WatermelonDB (poderoso, porém acopla telas ao banco reativo e é mais dependência do que o necessário); MMKV/JSON (sem queries relacionais para calendário/histórico).

## 2. Contratos que viabilizam o mecanismo

| Peça | Onde | Função |
| --- | --- | --- |
| `id` UUIDv7 gerado no cliente | local+servidor | linhas criadas offline já têm identidade global; reenvio é idempotente por PK |
| `row_version` (trigger no servidor) | Postgres | permite detectar "mudou desde que baixei" |
| `updated_at` (trigger) | Postgres | relógio canônico de LWW; cliente não o edita |
| `deleted_at` (soft delete) | ambos | exclusões sincronizam como tombstone; deleção física no servidor após janela de retenção de sync (30 dias, tarefa do sync, não do usuário) |
| `sync_ops` (outbox) | SQLite | fila `op ∈ (upsert, soft_delete)`, payload resumido, `attempt_count`, `next_retry_at` backoff exponencial 5s→cap 10min + jitter |
| índice único parcial de dedup | Postgres (`local_date, local_time, context`) + mesmo índice no SQLite | duplo clique/dispositivo → segunda escrita vira no-op/upsert na mesma linha (decisão: **mesmo minuto+contexto = a mesma medição**; usuário pode editar depois) |
| `last_pulled_at` por tabela | SQLite (meta) | âncora do delta pull |

## 3. Algoritmo de sincronização (por tabela, em ordem de dependência de FK: profiles → medications → schedules/reminders → measurements/logs)

**PUSH (drena outbox, em lote ≤ 100 ops, criado primeiro):**
1. Para cada `upsert` → `insert ... on conflict (id) do update set
   value=..., ... , updated_at=now(), row_version = glucose_measurements.row_version + 1
   where excluded.updated_at_local > glucose_measurements.updated_at`
   — ou seja: **escreve só se o servidor estiver mais antigo que a edição local** (conflicto → maior `updated_at` vence).
   Conflito de PK com linha existente e mais nova no servidor → resolve via PULL (passo seguinte) em vez de sobrescrever às cegas.
2. Para cada `soft_delete` → `update set deleted_at = coalesce(deleted_at, now())` (idempotente).
3. Sucesso → remove do outbox; erro 4xx de validação → marca `failed`, mantém cópia local, notifica UI (nunca descarta silenciosamente); 401 → re-auth antes de continuar; 5xx/rede → backoff.

**PULL (reconciliação):**
4. `select * ... where updated_at > last_pulled_at` (inclui tombstones) → aplica no espelho
   local apenas se servidor mais novo (`server.updated_at > local.updated_at or (igual e row_version>local)`); linhas tombstonadas e com `deleted_at < now() - 30d` somem do espelho.
5. Atualiza `last_pulled_at = max(updated_at)` do lote. Pull **antes** de permitir edição em
   linha stale é garantido pelo merge LWW determinístico.

Propriedades testadas na Fase 8 (unit + integração): idempotência (reenvio não duplica), convergência
(A→B→sync vs B→A→sync chegam ao mesmo estado), sobrevivência da fila a **reinício do app** (a fila
é persistida; reinstalação do app apaga fila não sincronizada — fora do escopo do MVP, risco R-OFF-3
registrado em `PHASE0-RISKS.md`), offline total por 7 dias e reconexão com 1000+ pendências
(conclusão do push < 30s em hardware de referência).

## 4. O que sincroniza e o que não sincroniza

- Sincronizam: medições, lembretes, medicamentos, schedules, logs de adesão, metas, perfil.
- NÃO sincronizam (só dispositivo): ids de notificações agendadas, estado de renderização,
  flags de tour, rascunho do formulário "Registrar" (SQLite local com TTL 24h — se o app fechar
  no meio do registro, o rascunho sobrevive; sem enviar nada).
- Lembretes: após sincronização bem-sucedida de `reminders`/`medication_schedules`, o agendador
  local re-registra o conjunto (cancel-all + schedule da lista ativa → idempotente e à prova de drift).

## 5. Estado de UI (obrigatório)

Barra/`SyncStatusBadge`: `online sincronizado · sincronizando (n) · offline (fila n) · erro n`.
Linhas locais ainda não confirmadas exibem marcador textual "salvo neste aparelho" — nunca só
ícone colorido.

## 6. Segurança do espelho local

- SQLite no sandbox do app (data protection no iOS; Android: `allowBackup=false` + keystore).
- EncryptedSharedPreferences/secure-store **apenas** para sessão/tokens (`expo-secure-store`);
  dados clínicos não vão para Keychain (limites de tamanho) nem para logs.
- Logout = apagar espelho e outbox (opção "manter neste aparelho" NÃO é oferecida no MVP).
- Sessão expirada: fila permanece no aparelho até re-autenticação (sem perda); 401 em 180 dias sem login → limpeza por privacidade.
