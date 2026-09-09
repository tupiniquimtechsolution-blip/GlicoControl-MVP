# FASE 0 — Arquitetura Definida

Concretiza `docs/ARCHITECTURE.md` (mantido como autoridade) para permitir implementação.

## 1. Formato do repositório

Decisão: **app Expo na raiz do repositório** + backend declarativo em `supabase/`.

```
GlicoControl-MVP/
├── app/                      # rotas expo-router (telas/navegação)
├── src/
│   ├── components/           # design system (Button, Card, ... ver §6)
│   ├── domain/               # tipos, validações, estatística, unidades, datas — PURO (sem React, sem I/O)
│   ├── features/             # glucose/ · reminders/ · medications/ · reports/ · profile/ · auth/
│   │   │                     #   (hooks de caso de uso: combine repos+validação+sync)
│   ├── services/             # supabase/ · notifications/ · pdf/ · storage/ · sync/
│   ├── theme/                # themes.ts (baseline, MOVIMENTO PROIBIDO de editar sem decisão) + tokens
│   │   │                     #   de tipografia/espaçamento/radius/motion + ThemeProvider
│   └── test/                 # harness de testes, fixtures, factories
├── supabase/
│   ├── migrations/           # SQL versionado (0001_init.sql, 0002_*.sql, ...)
│   └── tests/                # testes de RLS/policies executáveis via psql (ver PHASE0-RLS.md)
├── e2e/                      # fluxos Maestro (canônico §24 do prompt mestre)
├── docs/ · scripts/ · AGENTS.md · README.md · PROMPT_AGENT_FULLSTACK.md
```

Justificativa: um app + migrations SQL não justificam monorepo com workspaces; `src/domain`
preserva a exigência de separação de camadas (§26 do prompt mestre: UI ↔ features ↔ domain ↔ services),
e `supabase/` deixa migrations/policies como artefatos revisáveis em PR.

## 2. Stack fixada (versões estáveis verificadas em 2026-09-09 via npm)

| Camada | Escolha | Nota |
| --- | --- | --- |
| Runtime app | Expo SDK 57 (`expo@57.0.21`) via `create-expo-app@4.0.0` | linha estável mais recente do registry; `latest`=57.0.21. |
| Linguagem | TypeScript | usar a versão do template (5.9.x); **não** adotar `typescript@7` global por ora (compatibilidade com tooling Expo ainda em verificação; decisão pequena reversível — rever na Fase 10). |
| Navegação | `expo-router@57.0.x` | já no template default; arquivo = rota; grupos `(auth)`/`(app)`. |
| Backend | `@supabase/supabase-js@2.x` + Postgres/Auth/RLS | decisão `TOOLBOX_DECISIONS.md`, mantida. |
| Notificações | `expo-notifications` (local-first) | lembretes agendados no dispositivo; sem push server-side no MVP. |
| PDF | `expo-print` + `expo-sharing`, HTML→PDF no dispositivo | geração local (regra: não depender de serviço externo). |
| Offline | `expo-sqlite` + outbox próprio | detalhe em `PHASE0-OFFLINE-SYNC.md`. |
| Sessão | `expo-secure-store` | refresh token nunca em AsyncStorage. |
| Preferências não sensíveis | `@react-native-async-storage/async-storage` (via `expo install`) | tema, bandeiras de UI, últimos períodos visualizados. |
| Datas/UI base | `@react-native-community/datetimepicker@9.x`, `react-native-safe-area-context`, `react-native-screens` | instalados com `npx expo install` para pinning do SDK. |
| Gráficos | SVG próprio sobre `react-native-svg@15.x` | sem lib de charts: superfície menor de ataque/manutenção, offline, controlável para acessibilidade (legendas/marcadores exigidos pelo sistema de temas). |
| Testes | `jest-expo@57`, `@testing-library/react-native`, jest 30 | + testes SQL via psql (RLS). |
| Lint/format | `eslint` + `eslint-config-expo` + `prettier` | regras extras: proibir cor hardcoded fora de `src/theme` (§13 do prompt mestre). |

Regra de ouro: toda dependência Expo entra via `npx expo install` (pinning do SDK 57). Novas
dependências fora dessa lista exigem: licença verificada, manutenção ativa, ausência de
alternativa nativa — e registro em ADR (ver §7).

## 3. Camadas e regras de dependência

```
app/ (rotas, telas)      → depende de features/ e components/
features/ (casos de uso) → depende de domain/ e services/ (interfaces)
domain/ (regras puras)   → não depende de nada (sem React, sem Supabase, sem RN)
services/ (adapters)     → supabase-js, sqlite, notifications, print/sharing
components/ (design system) → depende apenas de theme/ e React Native
```

Proibições ativas (lint/test na Fase 1+):
- `domain/` importando `react`/`react-native`/`@supabase/*`.
- Componentes de UI lendo/escrevendo Supabase diretamente (toda persistência passa por `services/`).
- Cores literalizadas fora de `src/theme` (exceto preto/branco semântico quando documentado).
- Regras de negócio (validação, conversão de unidades, estatística de relatório) dentro de telas.

## 4. Domínio — módulos puros

- `domain/glucose/units.ts` — `mg/dL ⇄ mmol/L`, fator 18.0182, arredondamento canônico (mg/dL inteiro; mmol/L 1 decimal). Testado por golden values.
- `domain/glucose/validation.ts` — valor obrigatório, finito, > 0, dentro de faixa plausível (mg/dL: 20–600; mmol/L: 1–33). Fora da faixa plausível: **pedido de confirmação de digitação**, sem qualquer orientação clínica (§22 do prompt mestre).
- `domain/glucose/contexts.ts` — enum de contextos (§8 do prompt mestre) + rótulos pt-BR; estável entre app e banco.
- `domain/dates/` — mês local do paciente, dias do mês (28/29/30/31, bissexto), virada de dia, chave `YYYY-MM`, formatação `Intl`/`pt-BR`. Testes específicos exigidos (§21).
- `domain/reports/statistics.ts` — total, dias com/sem registro, média/mín/máx, agrupamento por contexto; entrada = lista de medições do mês; **sem side effects** (100% testável unitariamente).
- `domain/medications/` — apenas normalização de texto/validação de campos; **jamais** cálculo/interpretação de dose.

## 5. Services/adapters

- `services/supabase/client.ts` — único lugar que lê `EXPO_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY`; sem service-role sob hipótese alguma (client é "anon+RLS"); sessão persistida via `expo-secure-store` (`detectSessionInUser: false` + storage próprio).
- `services/supabase/repositories/` — um repo por agregado (`glucoseRepo`, `remindersRepo`, `medicationsRepo`, `medicationLogsRepo`, `targetsRepo`, `profileRepo`); API: `listForRange`, `upsertWithSyncMeta`, `softDelete`, `pullSince` — nunca SQL livre nas features.
- `services/sqlite/` — espelho local + outbox (ver `PHASE0-OFFLINE-SYNC.md`).
- `services/notifications/` — wrapper de `expo-notifications`: agendar/cancelar/snooze; canal Android com importância; consentimento de notificação no onboarding; **nunca** registra ação automaticamente.
- `services/pdf/` — monta HTML do relatório (dados do domínio) → `expo-print.printToFileAsync` → `expo-sharing`. Compartilhamento só após toque explícito.
- `services/observability/log.ts` — logger com sanitização por allowlist: eventos técnicos (op, tabela, duração, código de erro); **proibido** glicemia, nomes/doses, notas, tokens (gate de revisão de logs, Fase 9).

## 6. Design system e tema

- `ThemeApp = { colors (tokens do baseline), typography, spacing, radius, motion }`. Os 19 tokens de cor vêm de `src/theme/themes.ts` **sem edição**; a Fase 1 adiciona apenas tokens não-cor ao redor.
- `ThemeProvider` com `useAppTheme()`; preferência persistida (`pastelCalm | greenWhite | yellowWhite | blackWhite | blackYellow | system`); `system` resolve via `useColorScheme()` (opção prevista para ativar quando houver teste de paridade).
- Componentes (§25 do prompt mestre), todos com `accessibilityRole/Label`, alvo ≥ 44×44pt, foco visível com `focusRing`, estado nunca só por cor:
  `Button, Card, Input, NumberInput, DateTimeField, Select, MeasurementCard, ReminderCard,
  MedicationCard, MetricCard, CalendarDay, ChartCard, EmptyState, ConfirmationDialog, Toast,
  LoadingState, ErrorState` (+ `SyncStatusBadge`, novo, porque sync é estado permanente).
- Estados de tela obrigatórios em toda tela de dados: `loading · empty · success · error · offline · syncing`.

## 7. Registros de decisão (ADRs)

A partir da Fase 1, decisões não triviais viram `docs/adr/NNNN-titulo.md` (contexto → decisão → consequências). Decisões já tomadas na Fase 0 e que merecem ADR na Fase 1:
ADR-0001 formato do repo (raiz + `supabase/`); ADR-0002 expo-router; ADR-0003 SQLite + outbox como offline; ADR-0004 gráficos SVG próprios; ADR-0005 IDs client-side UUIDv7 + soft delete + row_version (pré-requisitos de sync).

## 8. Segurança de arquitetura (resumo, detalhe em PHASE0-RLS.md)

- Autorização 100% no Postgres via RLS; o cliente nunca é fonte de permissão.
- Nenhum endpoint próprio no MVP (mobile-first direto ao Supabase) → superfície: 4 tabelas de escrita + 3 de leitura/escrita controladas por RLS; rate limiting = limites do plano Supabase + validação estrita no client + policies; SAST = dependências + `npm audit` + secret scan no CI.
- Erros: nada de stack trace clínico em Toast; mensagens neutras, detalhes só em log técnico sanitizado.
