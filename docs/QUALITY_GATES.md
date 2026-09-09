# Quality Gates

## Gate por fase

- lint PASS;
- typecheck PASS;
- unit tests PASS;
- integration tests PASS quando aplicável;
- revisão do diff;
- documentação atualizada.

## Gate pré-release

- E2E do fluxo principal PASS;
- RLS/security tests PASS;
- build Android validado;
- build iOS validado quando ambiente disponível;
- acessibilidade básica validada;
- notificações locais validadas em device/build de desenvolvimento;
- PDF validado com mês completo e dias sem registro;
- secret scanning PASS;
- dependency audit sem vulnerabilidade crítica/alta não tratada;
- backup/restauração do banco testados;
- política de privacidade/termos revisados antes de publicação pública.

## E2E crítico

Conta → lembrete → registro → dashboard → calendário → relatório → PDF → compartilhamento.

---

## Resultado dos gates — FASE 1 (2026-09-09, sandbox)

| Gate | Comando | Resultado |
| --- | --- | --- |
| Lint | `npx eslint . --quiet` | **PASS** (0 erros; 39 warnings não-bloqueantes) |
| Typecheck | `npx tsc --noEmit` | **PASS** (0 erros) |
| Unit/integration/security | `npx jest --forceExit` | **PASS 11 suites / 71 testes** |
| RLS isolada | `bash scripts/rls/run-local.sh` | **PASS — 10/10 seções** (PGlite = Postgres real; A não lê/escreve/exclui B) |
| Contraste/temas | `node scripts/audit/contrast-audit.mjs` | **PASS** (AA nos 5 temas) |
| Secret scan | `bash scripts/audit/secret-scan.sh` | **PASS** |
| Textos clínicos proibidos | `bash scripts/audit/forbidden-texts.sh` + teste `clinical-language-gate` | **PASS** |
| Dependency audit | `npm audit --omit=dev --audit-level=high` | **PASS** (0 high/critical; 3 moderadas transituais sem patch upstream — `decode-uri-component` via `@expo/cli`; overrides `uuid@^11.1.1` aplicado) |
| SAST | ESLint de regras de arquitetura (camadas, cores fora de token, service_role proibido) | **PASS** |
| Offline (sync sem duplicação/LWW) | testes `sync-engine` (1000 pendências < 30 s; substituição por linha; skipped-stale) | **PASS** |
| Notificações | teste `notifications` (agendamento via scheduler real mockado por módulo; snooze; dias/horários) | **PASS** em harness — entrega real no aparelho: **BLOCKED** (sem device/Simulador no sandbox) |
| PDF | teste `pdf-report` (HTML → expo-print) | **PASS** conteúdo; impressão física: **BLOCKED** idem |
| E2E fluxo canônico | `e2e/canonical-flow.yaml` (Maestro) + `src/__tests__/flows.test.tsx` | componentes **PASS**; Maestro em device **BLOCKED** (sem Android SDK/emulador; `curl` de toolchain bloqueado pelo proxy) |
| Build nativo | `npx expo run:android` | **BLOCKED** — sem Android SDK/JDK no ambiente; comando exato: `cd GlicoControl-MVP && npx expo prebuild -p android && npx expo run:android` |
| CI | `.github/workflows/ci.yml` (espelha todos os gates acima) | criado; execução **BLOCKED** até o push ser processado pelo Actions |
| Build web (produção) | `npx expo export --platform web` | **PASS** (Metro bundle + static render de todas as rotas; requer `metro.config.js` com wasm em assetExts) |
