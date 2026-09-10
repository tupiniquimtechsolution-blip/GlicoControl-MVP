# FASE 0 — Backlog por Fases e Critérios de Aceite

Cobre os itens 7 e 8 do gate. Cada fase abaixo vira um epic com Issues pequenas e verificáveis
criadas no GitHub no início da fase (§28 do prompt mestre). Aceite por fase = todos os itens +
gates de `docs/QUALITY_GATES.md` (lint, typecheck, unit, integration quando aplicável, diff review,
docs atualizados) executados e reportados com evidência.

Legenda de ambiente: [S] executável nesta sandbox · [E] requer ambiente externo (device/emulador/serviço) —
fica como pendência de release documentada, nunca declarado PASS sem execução.

## FASE 1 — Foundation [S]
Issues: 1.1 scaffold Expo SDK 57 na raiz · 1.2 estrutura de camadas + eslint boundaries (proíbe imports proibidos) · 1.3 ThemeProvider + 5 temas + `system` · 1.4 tokens de tipografia/espaçamento/radius/motion · 1.5 navegação base ((auth)/(app), tabs, register modal) com guard de sessão fake · 1.6 Button, Card, Input, NumberInput, Select, EmptyState, LoadingState, ErrorState, ConfirmationDialog, Toast · 1.7 teste de contraste por componente + harness `no-color-only` · 1.8 CI GitHub Actions (lint+typecheck+test).
**Aceite:** `npx expo run:ios --no-bundle`-equivalente não é requerido; `npm run typecheck|lint|test` PASS [S]; app abre no web preview? (não requerido); screenshots dos 5 temas documentados em `docs/screenshots/` via jest snapshots quando device indisponível; temas persistem preferência entre reinícios do app (AsyncStorage testado); zero hex fora de `src/theme` (lint).

## FASE 2 — Backend [S+E]
Issues: 2.1 migrations 0001–0010 · 2.2 triggers `set_updated_at`/`row_version`/soft-delete · 2.3 índices (calendário, dedup parcial) · 2.4 RLS policies todas as tabelas · 2.5 harness Postgres local (apt) + `auth.uid()` stub + roles · 2.6 `supabase/tests/rls_isolation.sql` T1–T10 · 2.7 job de CI com service container postgres · 2.8 `services/supabase/client.ts` + repositórios tipados (mockable) · 2.9 config Auth (signup/login/logout/reset, secure-store).
**Aceite:** migrations aplicam em Postgres limpo [S]; **T1–T10 PASS** [S]; `anon` sem acesso a nada; `service_role` ausente do repositório (secret scan no CI); integração client↔Supabase real: [E] quando projeto provisionado — bloqueia somente release, não a Fase 2 de código.

## FASE 3 — Glicemia [S]
Issues: 3.1 `domain/glucose` (units, validation, contexts) + golden tests · 3.2 CRUD via repos (local-first já com espelho SQLite simplificado — fundação da Fase 8) · 3.3 tela Registrar (fluxo ≤ 5s, anti duplo-clique, confirmação de plausibilidade) · 3.4 editar/excluir com confirmação · 3.5 Dashboard (última medição, resumo do dia, atalhos) · 3.6 Histórico com filtros (data/período/contexto).
**Aceite:** testes unitários de conversão/validação/estatística PASS; CRUD E2E de componentes (RTL) PASS; validações do §22 cobertas (vazio, NaN, unidade inválida, data inválida, double-click); MG↔MMOL exibição correta; estado vazio/offline/error em cada tela; **nenhum texto clínico imperativo** (grep-gate por teste de conteúdo, ver FASE 9).

## FASE 4 — Calendário [S]
Issues: 4.1 grid mensal (domingo–sábado BR? — decisão: padrão `pt-BR` inicia segunda? **decisão: inicia no domingo** seguindo `Intl` locale default, testado) · 4.2 badges de contagem por dia + "sem registro" textual · 4.3 `calendar/[day]` cronológico · 4.4 viradas de mês/ano, fevereiro, bissexto, 30/31, meia-noite, mudança de timezone (testes exaustivos §21) · 4.5 navegação por gestos/teclado + a11y announce dia selecionado.
**Aceite:** suíte de datas com casos §21 PASS; calendário renderiza 240 meses aleatórios sem crash (property test); tocar no dia abre medições do dia exatas (fixture).

## FASE 5 — Lembretes [S+E]
Issues: 5.1 CRUD `reminders` · 5.2 agendador local (`expo-notifications`) + permission flow · 5.3 ações Registrar agora / Lembrar depois / Marcar realizada (deep-links) · 5.4 snooze · 5.5 edição = re-schedule idempotente · 5.6 tela de lista com toggles.
**Aceite:** unit: cálculo do próximo disparo (dias da semana, horário, fuso, DST BR inexistente hoje mas coberto genericamente) PASS; integração scheduling mockada PASS; disparo real em device [E — pendência de release, checklist documentado].

## FASE 6 — Medicamentos [S+E]
Issues: 6.1 CRUD medications + schedules (FK composto) · 6.2 notificações com Tomei/Adiar/Ignorar · 6.3 `medication_logs` imutáveis · 6.4 tela de resumo de adesão (n taken/snoozed/skipped do mês — contagens puras, sem interpretação) · 6.5 teste de comportamento: notificação que chega NÃO cria log (garantia programática + teste RTL).
**Aceite:** unit/integration de ações e logs PASS; E2E-de-componente do fluxo notificação→"Tomei"→log persistido (mock) PASS; dispositivo real [E].

## FASE 7 — Relatórios [S]
Issues: 7.1 agregações `domain/reports` (total, dias c/sem, média/mín/máx, por contexto) · 7.2 gráfico evolução + por contexto (SVG, legenda, marcadores) · 7.3 template HTML do PDF (5 temas adaptados? **decisão: PDF sempre em tema claro de alta legibilidade**, documentado) · 7.4 `expo-print` → arquivo; `expo-sharing` · 7.5 banner "gerar mês anterior" na virada · 7.6 preview em tela com tabela completa.
**Aceite:** golden tests de estatística (mês cheio, com buracos, 29 fev); PDF gerado em CI headless (web build? — decisão: teste de **geração de HTML** + snapshot; arquivo PDF real validado [E] em device); compartilhamento só por toque (teste de UI); rodapé "não constitui avaliação médica" presente e testado.

## FASE 8 — Offline [S]
Issues: 8.1 SQLite completo (espelho + outbox + meta) · 8.2 motor de sync push/pull LWW · 8.3 dedup/índice único espelhado · 8.4 tombstones + retenção 30d · 8.5 `SyncStatusBadge` + estados "salvo neste aparelho" · 8.6 testes de rede simulada (avião por 7d, 1000 pendências, kill mid-push) · 8.7 logout = wipe do espelho.
**Aceite:** propriedades do `PHASE0-OFFLINE-SYNC.md` §3 testadas e PASS [S]; zero perda em suíte aleatória (property-based, seed publicada no teste).

## FASE 9 — Hardening [S+E]
Issues: 9.1 dependency audit + patch (sem vuln crítica/alta) · 9.2 secret scan no CI (gitleaks ou equivalente open-source) · 9.3 SAST (semgrep regras RN/JS) · 9.4 revisão de logs (grep por `console.*` com campos clínicos; logger sanitizado único) · 9.5 audit de permissões do app.json (notifs; sem location/camera) · 9.6 LGPD: telas de consentimento, exportação JSON, exclusão de conta com confirmação em duas etapas · 9.7 a11y pass final (contraste por componente, verificação manual TalkBack/VoiceOver? — decisão: checklist + testes automatizados, device [E]) · 9.8 performance (startup, scroll calendário, sync de 1k) com budgets documentados.
**Aceite:** relatórios anexados no PR; achado crítico/alto bloqueia (§23).

## FASE 10 — QA/Release [S+E]
Issues: 10.1 E2E canônico §24 com Maestro (`e2e/canonical.yml`) — execução [E device], estrutura validada [S] · 10.2 build Android EAS local-assist/produto [E] · 10.3 iOS quando ambiente [E] · 10.4 documentação final: CHANGELOG, RELEASE-CHECKLIST, notas de pendências [E] · 10.5 rodar suite RLS contra Supabase real [E quando credencial aprovada].
**Aceite:** matriz do §29 prompt mestre (cada item com evidência S ou pendência E explicitamente listada — **sem PASS declarado para E não executados**).

## Critérios de aceite globais (MVP pronto — §29)

Repetidos aqui como contrato de teste final: cadastro/login; 5 temas selecionáveis e persistentes;
lembretes configuráveis; medições registrar/editar; medicamentos prescritos registrados com ações
manuais; calendário/histórico; relatório mensal; PDF aberto/compartilhado; a11y sem dependência de cor;
logout/login sem perda. Cada um ligado a um teste automatizado ou evidência de execução documentada.
