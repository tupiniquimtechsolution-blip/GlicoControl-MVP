# Roadmap Canônico — Waves, Etapas e Tasks

**Data-base:** 2026-09-22  
**Projeto:** GlicoControl-MVP  
**Branch de integração:** `agent/fullstack-mvp`

## Convenção de status

- ✅ **Concluída** — há evidência verificável suficiente;
- 🔄 **Em Andamento** — trabalho iniciado e ainda não encerrado;
- ⏳ **Aguardando** — depende de ação/condição externa;
- ⛔ **Bloqueada** — há impedimento concreto;
- ⬜ **A Fazer** — não iniciado ou sem evidência de início.

---

## W0 — Governança, escopo e Fase 0

**Objetivo:** definir produto, limites clínicos, arquitetura, dados, segurança, navegação, riscos e backlog antes de construir.

**Status:** ✅ Concluída.

| Seq | Task | Status | Evidência |
|---:|---|---|---|
| 10 | Inicializar repositório e baseline | ✅ | commits iniciais + docs base |
| 11 | Definir produto e limites clínicos | ✅ | `docs/PRODUCT_SCOPE.md` |
| 12 | Definir arquitetura Expo + Supabase | ✅ | `docs/ARCHITECTURE.md`, planning |
| 13 | Definir modelo de dados/RLS | ✅ | `docs/planning/PHASE0-DATA-MODEL.md`, `PHASE0-RLS.md` |
| 14 | Definir UX/navegação | ✅ | `PHASE0-NAVIGATION-UX.md` |
| 15 | Definir offline/sync | ✅ | `PHASE0-OFFLINE-SYNC.md` |
| 16 | Registrar riscos e backlog | ✅ | `PHASE0-RISKS.md`, `PHASE0-BACKLOG.md` |
| 17 | Fechar Issue Fase 0 | ✅ | Issue #1 fechada como completed |

**Gate de saída:** planejamento suficiente para implementação sem reinventar escopo. **PASS**.

---

## W1 — Implementação full-stack do MVP

**Objetivo:** entregar o fluxo funcional completo do MVP.

**Status:** ✅ Concluída.

| Seq | Task | Status | Evidência |
|---:|---|---|---|
| 20 | Auth e contexto de sessão | ✅ | implementação PR #2 |
| 21 | Dashboard e navegação principal | ✅ | implementação PR #2 |
| 22 | CRUD de medições | ✅ | implementação + testes |
| 23 | Histórico e calendário | ✅ | implementação + testes |
| 24 | Lembretes de glicemia | ✅ | implementação |
| 25 | Medicamentos e agenda | ✅ | implementação |
| 26 | Adesão/medication logs | ✅ | implementação |
| 27 | Relatório mensal | ✅ | implementação |
| 28 | PDF e compartilhamento | ✅ | implementação |
| 29 | Perfil/privacidade/export/delete | ✅ | implementação |
| 30 | Offline SQLite/outbox/sync | ✅ | implementação |
| 31 | Backend migrations/RLS base | ✅ | migrations 0001–0013 |

**Gate de saída:** MVP funcional construído e integrado. **PASS de implementação; não equivale a release de produção.**

---

## W2 — Hardening pré-merge: CI, segurança e LGPD

**Objetivo:** eliminar falsos positivos de qualidade e endurecer backend/cliente.

**Status:** ✅ Concluída.

| Seq | Task | Status | Evidência |
|---:|---|---|---|
| 40 | Padronizar Node 22 | ✅ | CI + `engines` |
| 41 | Remover `--forceExit` do Jest | ✅ | CI limpo |
| 42 | Corrigir cleanup/open handles/providers | ✅ | testes/CI |
| 43 | Tornar exclusão LGPD verdadeira na UX | ✅ | PR #2 hardening |
| 44 | Endurecer privilégios RPC | ✅ | migration 0014 |
| 45 | Criar testes de grants RPC | ✅ | `rpc_privileges.sql` |
| 46 | Canonizar temas | ✅ | docs + theme audit |
| 47 | Secret scan e texto clínico proibido | ✅ | CI |
| 48 | Merge PR #2 em branch de integração | ✅ | merge `dc337a7...` |

---

## W3 — Supabase gerenciado real, RLS e semântica de sync

**Objetivo:** provar comportamento no banco real, não apenas em testes locais.

**Status:** ✅ Concluída.

| Seq | Task | Status | Evidência |
|---:|---|---|---|
| 50 | Criar projeto Supabase Free | ✅ | ref `bvyhtoimcprhfmbyrsoi` |
| 51 | Aplicar migrations 0001–0014 | ✅ | Supabase gerenciado |
| 52 | Tratar advisors segurança/performance | ✅ | migration 0015 |
| 53 | Validar RLS A×B real | ✅ | transação + rollback limpo |
| 54 | Validar privilégios anon/auth | ✅ | query real |
| 55 | Validar RPC sync real | ✅ | `applied`, `skipped-stale`, `parent-missing` |
| 56 | Corrigir gateway cliente para status textual | ✅ | PR #3 |
| 57 | Integrar PR #3 | ✅ | merge `c3a3ac9...` |

### Observações

Os únicos avisos de segurança remanescentes conhecidos são intencionais/documentados para RPCs `SECURITY DEFINER` autenticadas e restringidas. Avisos de `unused_index` em banco novo são informativos.

---

## W4 — Auth PKCE e privacidade de sessão

**Objetivo:** evitar tokens no deep link e impedir persistência local entre usuários.

**Status geral:** 🔄 Implementação concluída; validação end-to-end real pendente.

| Seq | Task | Status | Evidência/dependência |
|---:|---|---|---|
| 60 | Migrar cliente para PKCE | ✅ | PR #5 |
| 61 | Callback exclusivo de confirmação | ✅ | `glicocontrol://auth-confirm` |
| 62 | Callback exclusivo de recovery | ✅ | `glicocontrol://auth-recovery` |
| 63 | Rejeitar fluxo implícito/token em URL | ✅ | testes PR #5 |
| 64 | Wipe de `local_profile` e cursores no logout | ✅ | PR #5 |
| 65 | Merge PR #5 | ✅ | merge `04443bf...` |
| 66 | Confirmar allowlist das duas URLs no Supabase | ⏳ | ação externa não comprovada no histórico |
| 67 | Testar signup + confirmação real | ⬜ | depende 66 |
| 68 | Testar password recovery real | ⬜ | depende 66 |
| 69 | Testar logout → novo usuário sem vazamento | ⬜ | dispositivo/ambiente real |

**Gate de saída:** 66–69 precisam de evidência antes de produção.

---

## W5 — Android native, Development Build e APK standalone

**Objetivo:** provar compilação Android real e gerar artefatos instaláveis.

**Status:** ✅ Concluída para build/artifact.

| Seq | Task | Status | Evidência |
|---:|---|---|---|
| 70 | Corrigir `appId` Maestro vs `app.json` | ✅ | PR #4 |
| 71 | Gate automático de consistência appId | ✅ | CI |
| 72 | Android SDK 36 / Java 17 / NDK 27.1 | ✅ | Actions |
| 73 | `expo prebuild` Android | ✅ | Android Native Gate |
| 74 | `assembleDebug` multi-ABI | ✅ | Android Native Gate |
| 75 | Development Build com `expo-dev-client` | ✅ | artifact gerado |
| 76 | Standalone `assembleRelease` | ✅ | job `103545470381` |
| 77 | Validar JS bundle embutido | ✅ | `assets/index.android.bundle` |
| 78 | Validar assinatura do APK de teste | ✅ | `apksigner verify` |
| 79 | Publicar artifact standalone | ✅ | artifact `glicocontrol-standalone-test-apk` |

**Nota:** APK de teste utiliza assinatura de debug/local e não é build de loja.

---

## W6 — E2E Android e validação em dispositivo

**Objetivo:** provar comportamento real da aplicação, não apenas build.

**Status:** ⛔ Parcialmente bloqueada.

### W6.1 Maestro em emulador

| Seq | Task | Status | Evidência/dependência |
|---:|---|---|---|
| 80 | Fixar Maestro 2.7.0 + checksum | ✅ | PR #6 |
| 81 | Fixar emulator-runner por commit | ✅ | PR #6 |
| 82 | Alinhar seletores E2E com UI real | ✅ | PR #6 |
| 83 | Corrigir shell/run script do emulator-runner | ✅ | PR #6 |
| 84 | Tornar `nextDue` determinístico | ✅ | PR #6 |
| 85 | Executar fluxo canônico completo | ⛔ | Metro/React Native DevTools/runner; PR #6 aberto |
| 86 | Decidir correção ou supersessão formal do PR #6 | ⬜ | ADR necessário se abandonar Maestro |

**Importante:** Firebase Robo Test é complementar e **não substitui automaticamente** um fluxo determinístico Maestro. Se Maestro for removido, registrar ADR com cobertura alternativa equivalente.

### W6.2 Dispositivo físico Android

| Seq | Task | Status | Dependência |
|---:|---|---|---|
| 90 | Instalar build atual em Android físico | ⬜ | artifact válido |
| 91 | Testar notificações/permissões/agendamento | ⬜ | aparelho físico |
| 92 | Testar PDF e share sheet | ⬜ | aparelho físico |
| 93 | Testar offline → restart → reconnect → sync | ⬜ | Supabase + aparelho |
| 94 | Testar alteração de tema/acessibilidade | ⬜ | aparelho |
| 95 | Testar logout/troca de usuário | ⬜ | Auth real |
| 96 | Registrar evidências e bugs | ⬜ | após 90–95 |

---

## W7 — Preview web e Cloudflare Pages

**Objetivo:** manter preview contínuo e gratuito por branch/PR após migração de infraestrutura.

**Status:** 🔄 Em Andamento.

### Histórico

Vercel foi configurado e validado anteriormente, mas deixou de ser a arquitetura operacional após decisão de migrar todos os projetos para Cloudflare.

### Tasks atuais

| Seq | Task | Status | Evidência/dependência |
|---:|---|---|---|
| 100 | Migrar projeto para Cloudflare | ✅* | informado pelo proprietário; precisa reconciliar detalhes no repo |
| 101 | Alterar documentação canônica Vercel → Cloudflare | 🔄 | esta wave documental |
| 102 | Remover `vercel.json` legado | ⬜ | branch documental/infra |
| 103 | Versionar `public/_headers` | ⬜ | preservar COOP/COEP/nosniff/referrer |
| 104 | Confirmar build command `npm run build:web` | ⬜ | Cloudflare Dashboard |
| 105 | Confirmar output `dist` | ⬜ | Cloudflare Dashboard |
| 106 | Confirmar `EXPO_PUBLIC_DEMO_MODE=demo-local` em preview | ⬜ | Cloudflare Dashboard |
| 107 | Capturar URL `*.pages.dev` canônica | ⬜ | Cloudflare Dashboard |
| 108 | Validar HTTP 200 + SQLite web + rotas | ⬜ | após 107 |
| 109 | Validar preview automático PR/branch | ⬜ | após Git integration |

`*` A conclusão da migração é uma decisão/informação do proprietário; os gates 104–109 ainda precisam de evidência operacional no repositório/documentação.

---

## W8 — Firebase Test Lab Spark

**Objetivo:** validar APK standalone em dispositivo Android virtual hospedado, sem custo.

**Status:** ⏳ Aguardando configuração externa.

| Seq | Task | Status | Evidência/dependência |
|---:|---|---|---|
| 110 | Criar projeto Firebase Spark `teste-d2d1d` | ✅ | projeto informado/criado |
| 111 | Criar workflow Robo manual | ✅ | PR #8 |
| 112 | Fixar Project ID no workflow | ✅ | `teste-d2d1d` |
| 113 | Gerar APK standalone compatível | ✅ | W5 / standalone gate PASS |
| 114 | Habilitar Cloud Testing API | ⏳ | Google Cloud externo |
| 115 | Habilitar Cloud Tool Results API | ⏳ | Google Cloud externo |
| 116 | Criar service account exclusiva | ⏳ | externo |
| 117 | Configurar WIF GitHub OIDC | ⏳ | externo |
| 118 | Adicionar `GCP_WORKLOAD_IDENTITY_PROVIDER` | ⏳ | GitHub repo variable |
| 119 | Adicionar `GCP_SERVICE_ACCOUNT` | ⏳ | GitHub repo variable |
| 120 | Rodar primeira Robo matrix virtual | ⬜ | depende 114–119 |
| 121 | Registrar resultado/evidências | ⬜ | depende 120 |
| 122 | Tirar PR #8 de draft e integrar | ⬜ | após política definida para gate real |

Regra: manter Spark e sem billing/Blaze. Se a cota gratuita acabar, aguardar renovação; não ativar cobrança.

---

## W9 — Release Candidate e promoção para `main`

**Objetivo:** transformar a branch de integração validada em release candidate.

**Status:** ⛔ Bloqueada.

### Dependências obrigatórias

- W4 Auth real final;
- W6 dispositivo/E2E;
- W7 Cloudflare reconciliado;
- W8 Test Lab;
- segurança/dependências sem bloqueios high/critical;
- documentação sincronizada.

| Seq | Task | Status |
|---:|---|---|
| 130 | Fechar/mergear/encerrar formalmente PR #6 | ⬜ |
| 131 | Fechar/mergear PR #8 | ⬜ |
| 132 | Executar quality gates finais no HEAD candidato | ⬜ |
| 133 | Auditoria LGPD/security final | ⬜ |
| 134 | Gerar release notes/changelog | ⬜ |
| 135 | Abrir PR `agent/fullstack-mvp → main` | ⛔ |
| 136 | Revisar evidências e aprovar promoção | ⛔ |
| 137 | Tag de release candidate | ⬜ |

---

## W10 — Piloto e comercialização

**Objetivo:** validar utilidade, retenção e modelo comercial com usuários reais, sem ampliar escopo clínico.

**Status:** ⬜ Futuro.

| Seq | Task | Status |
|---:|---|---|
| 140 | Definir protocolo de piloto e consentimento | ⬜ |
| 141 | Definir cohort pequeno e critérios de entrada | ⬜ |
| 142 | Definir métricas de produto/privacidade | ⬜ |
| 143 | Validar onboarding/ativação | ⬜ |
| 144 | Validar relatório com usuários/profissionais | ⬜ |
| 145 | Pesquisa de disposição a pagar | ⬜ |
| 146 | Testar faixa Free/Pro | ⬜ |
| 147 | Definir suporte/SLA | ⬜ |
| 148 | Decidir modelo B2C/B2B/white-label | ⬜ |

### Publicação em lojas

Qualquer loja/taxa paga permanece **bloqueada pela política de custo zero**. A decisão só pode mudar com autorização explícita do proprietário.

---

# Caminho crítico atual

```text
Cloudflare reconciliado ─┐
Auth real ────────────────┼─> Release Candidate ─> PR para main
Dispositivo físico ───────┤
E2E/ADR ──────────────────┤
Firebase Test Lab ─────────┘
```

## Ordem recomendada de execução

1. W7 — Cloudflare pós-migração;
2. W8 — concluir WIF/APIs e Robo Test;
3. W6 — dispositivo físico e decisão Maestro;
4. W4 — Auth real junto do gate físico;
5. W9 — release candidate;
6. W10 — piloto.

---

# Definição de Done global

Uma task só está concluída quando houver uma evidência compatível com sua natureza:

- código: commit/PR + CI;
- banco: migration/query/test real;
- build: workflow + artifact;
- externo: configuração + validação funcional;
- dispositivo: roteiro executado + evidência registrada;
- documentação: arquivo atualizado + sincronização operacional.
