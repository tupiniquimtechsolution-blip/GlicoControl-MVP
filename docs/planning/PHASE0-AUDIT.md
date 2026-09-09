# FASE 0 — Diagnóstico do Estado Inicial (Auditoria)

Data da auditoria: 2026-09-09 · Branch de referência: `agent/fullstack-mvp` @ `dab3e8ab534f01ccbe8a85844fa8b52460204f05`
(sessão de trabalho na branch derivada `arena/01a087c1-glicocontrol-mvp`, mesmo commit-base; PRs abertos contra `agent/fullstack-mvp`).

## 1. Estado real verificado do repositório

Verificações efetivamente executadas (não assumidas):

| Verificação | Método | Resultado |
| --- | --- | --- |
| Histórico Git | `git log --oneline` | 1 commit: `dab3e8a chore: add toolbox baseline themes and agent contract`. Árvore de trabalho limpa (`git status`). |
| Branches remotas | `git ls-remote origin` | `main` e `agent/fullstack-mvp` apontam para o MESMO commit `dab3e8a`. Nenhum código divergente a preservar. |
| Conteúdo versionado | `git ls-files` | 13 arquivos: contratos (`AGENTS.md`, `PROMPT_AGENT_FULLSTACK.md`), docs (`README.md`, `docs/*.md` ×6), skill (`.agents/skills/tupiniquim-toolbox/SKILL.md`), baseline (`src/theme/themes.ts`), `​.env.example`, `.gitignore`. |
| Código de aplicação | inspeção | **Inexistente.** Não há `package.json`, Expo app, `app.json`, migrations, testes ou CI. O repositório está exatamente como `README.md` declara: BOOTSTRAP / PRÉ-DESENVOLVIMENTO. |
| Secrets versionados | `git ls-files` + grep por `.env` real/keys | Nenhum `.env` real, token, chave privada, keystore ou credencial versionados. `.gitignore` já exclui `.env*` (exceto `.env.example`), `*.keystore`, `*.jks`, `*.p8`, `*.p12`, `*.mobileprovision`. |
| `.env.example` | leitura | Somente chaves públicas previstas: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (sem valores, sem service-role). Compatível com a baseline de segurança. |
| Documentação | leitura integral | `README.md`, `AGENTS.md`, `SKILL.md` do Toolbox, os 6 docs de `docs/`, `PROMPT_AGENT_FULLSTACK.md` e `src/theme/themes.ts` lidos por completo. Consistentes entre si; sem contradições detectadas. |
| Issue #1 (gate) | `gh api .../issues/1` | Existe, aberta, com 12 itens de checklist e gate: nenhum produto declarado pronto antes de concluir esta fase. |

## 2. Baseline Tupiniquim validado

### 2.1 `src/theme/themes.ts` — estrutura

- 5 temas: `pastelCalm`, `greenWhite`, `yellowWhite`, `blackWhite`, `blackYellow` — idênticos ao README/`docs/THEME_SYSTEM.md`.
- Cada tema declara os mesmos **19 tokens semânticos de cor**, sem tokens faltantes, extras ou fora do formato `#RRGGBB`.
- `dark` correto: `false` para os 3 claros, `true` para os 2 escuros.
- `defaultThemeName = 'greenWhite'` (declarado no arquivo; o produto não fixa tema além da preferência persistida do usuário).

### 2.2 Contraste medido (WCAG 2.x), não estimado

Script: `scripts/audit/contrast-audit.mjs` (reproduzível com `node scripts/audit/contrast-audit.mjs`).

- 10 pares de **texto** por tema (incl. `text`/`textMuted` sobre `background`/`surface`/`surfaceAlt`, `onPrimary`/`primary`, estados semânticos sobre `surface`): **todos ≥ 4.5:1**. Mínimos observados: `pastelCalm textMuted/background 4.88`, `greenWhite textMuted/background 5.00`, `pastelCalm warning/surface 4.69`.
- 9 pares de **UI/gráficos** por tema (primary, focusRing, estados e `chart1..4` sobre `surface`): **todos ≥ 3.0:1** (mínimo observado 4.61).
- **Resultado: 0 falhas em 95 verificações.**

Ressalvas honestas (não falhas, são limites do método):

- O script cobre pares-token fixos. Combinações dependentes de componente (ex.: texto sobre `secondary`/`accent` como fundo de chips) devem ser cobertas por teste de contraste por componente na Fase 1 (ver backlog).
- `eval` textual do objeto é aceitável para o baseline atual; na Fase 1 o teste de temas passa a importar os tokens compilados e o script de bootstrap pode ser aposentado.

### 2.3 Documentos de decisão — aderência

- `AGENTS.md`: regras clínicas invariantes, RLS obrigatório, proibição de secrets, fluxo PLANEJAR→…→CHECKPOINT — integralmente adotados como constraints deste plano.
- `docs/TOOLBOX_DECISIONS.md`: Expo+RN+TS (score 93 vs Flutter 78), Supabase para Postgres/Auth/RLS, loadout de design (UI UX Pro Max principal; Emil sob demanda; Taste Skill fora), Vibe Coding Toolkit como playbook de qualidade, Strix apenas para pentest autorizado pré-release. **Mantidas; não reabertas.**
- `docs/QUALITY_GATES.md`: gates por fase e pré-release definem os critérios de aceite detalhados em `PHASE0-BACKLOG.md`.
- `docs/SECURITY_PRIVACY.md`: define o capítulo de RLS/privacidade deste plano (minimização, logs sem conteúdo clínico, compartilhamento explícito).

## 3. Aplicação do Tupiniquim Toolbox nesta fase

Conforme `.agents/skills/tupiniquim-toolbox/SKILL.md` — "carregue somente capacidades pertinentes":

| Capacidade | Uso na FASE 0 |
| --- | --- |
| UI UX Pro Max | Referência para critérios de acessibilidade/contraste e estados de UI aplicados no plano (não foi copiado código externo). |
| Vibe Coding Toolkit | Estrutura plan → gates → handoff usada neste documento (diagnóstico com evidências, backlog verificável, riscos). |
| emilkowalski/skills (motion) | Não carregada nesta fase (sem implementação visual). |
| Strix (pentest) | Não executada: não há ambiente próprio para testar ainda. Fica agendada como gate pré-release (Fase 9/10). |
| Open Generative AI / Agent Reach / Awesome LLM Apps / CLI-Anything | Deliberadamente não carregadas (sem IA no MVP; decisão registrada em `docs/TOOLBOX_DECISIONS.md`). |

Licenças/origem: nenhum código externo foi copiado nesta fase; apenas padrões abertos (WCAG 2.x, práticas Supabase RLS) citados por referência. A regra "não copiar código externo cegamente" continua válida para as fases de implementação.

## 4. Ambiente técnico disponível (sandbox de desenvolvimento)

Medido, não presumido — importa para os gates:

- Node `v22.22.3`, npm `10.9.8`, yarn `1.22.22`, Python `3.11.2`; rede para registry npm OK (HTTP 200 em registry.npmjs.org).
- `pnpm` ausente (não é bloqueante; usar npm + `npx expo install`).
- **Docker/Podman ausentes** e **Postgres ausente** (`psql`/`initdb` não existem). `apt-get` disponível → Postgres local instalável para testes de RLS via SQL puro (estratégia em `PHASE0-RLS.md`); sem supabase CLI local e sem emulador Android/iOS.
- Consequência honesta para gates: E2E com app real em dispositivo/emulador, push em device e builds nativos completos **não são executáveis neste ambiente**; o plano define quais checks rodam aqui (unit, integration de lógica, RLS via Postgres local, typecheck, lint, testes de componentes) e quais ficam marcados como pendências de release com procedimento documentado para execução externa. **Nada será declarado PASS sem execução real aqui.**

## 5. Lacunas entre baseline e MVP (o que falta construir)

1. Projeto Expo/React Native/TypeScript (inexistente).
2. Navegação, ThemeProvider, design system com os 16 componentes previstos.
3. Backend Supabase:Auth, schema/migrations, RLS, testes de isolamento.
4. Features: glicemia CRUD, calendário, lembretes, medicamentos/adesão, relatórios/PDF, offline/sync.
5. Testes unit/integration/security/E2E e CI.
6. Artefatos LGPD (fluxo de consentimento, exportação, exclusão) no app.

## 6. Diagnóstico consolidado

- O bootstrap **é válido e está íntegro**: decisões consistentes, temas completos com contraste medido aprovado, zero secrets, stack definida, gate claro.
- O repositório é **documentação + baseline puro** — não há código a preservar alé de `src/theme/themes.ts`, que será consumido (não reescrito) pelo app.
- Risco de continuidade é baixo; o trabalho é greenfield **sobre** decisões existentes, não contra elas.
- Duas decisões estruturais precisavam de definição nesta fase e foram tomadas com justificativa: **layout do monorepo** e **estratégia offline** — detalhadas em `PHASE0-ARCHITECTURE.md` e `PHASE0-OFFLINE-SYNC.md`.

## Próximos passos

Execução sequencial com gates (`PLANEJAR → IMPLEMENTAR → TESTAR → CORRIGIR → REVIEW DO DIFF → DOCUMENTAR → COMMIT`):

1. **FASE 1 — Foundation** (próxima, imediata): scaffold Expo SDK 57 na raiz com `npx create-expo-app@4 --template default` (versões estáveis, `npx expo install` para pacotes Expo), estrutura de camadas, ThemeProvider + 5 temas consumindo `src/theme/themes.ts`, navegação base (5 tabs + stack de auth), ESLint/Prettier/Jest(jest-expo), testes de tema/contraste por componente, `npm run typecheck|lint|test` executados e reportados.
2. **FASE 2 — Backend**: `supabase/migrations` versionadas + testes de RLS contra Postgres local (apt) simulando `auth.uid()`/roles, sem expor serviço real.
3. Fases 3→10 conforme `PHASE0-BACKLOG.md`, cada uma fechando com o relatório obrigatório (FASE/STATUS/…/PRÓXIMO PASSO) e evidências de testes executados.
