# GlicoControl MVP

Aplicativo mobile-first para registro e acompanhamento de medições de glicemia, lembretes configuráveis de medições/medicações e geração de relatório mensal em PDF para apresentação ao profissional de saúde.

## Estado

**FASE 1 EXECUTADA — MVP ponta a ponta no repositório** (Auth, Dashboard, Registro, Histórico, Calendário, Lembretes, Medicamentos, Relatórios+PDF, Perfil; 5 temas; RLS testada; offline-first com outbox/LWW). Portões de qualidade em [`docs/QUALITY_GATES.md`](docs/QUALITY_GATES.md). Build nativo, notificação em aparelho físico e Maestro em device são validados fora deste sandbox (ver "Limitações do ambiente" no final do relatório/QUALITY_GATES).

O que o app **não** faz: diagnóstico, prescrição, cálculo de dose/insulina, ajuste de tratamento ou envio de dados a terceiros sem ação explícita do usuário.

## Stack

Expo SDK 57 (React Native 0.86, TypeScript), expo-router em `src/app/`, expo-sqlite (espelho local), Supabase (Postgres + Auth + RLS), jest-expo + Testing Library, Maestro (E2E em device), PGlite (testes de RLS com Postgres real em node).

## Como executar

```bash
npm install
npx expo start            # demo local (sem backend) — EXPO_PUBLIC_DEMO_MODE=demo-local é automático em dev
# dispositivo: Expo Go | emulador: npx expo run:android (precisa Android SDK)
npm test                  # 11 suites / 71 testes (unit+integration+security+fluxos)
npm run typecheck && npm run lint
bash scripts/rls/run-local.sh      # RLS: 10 seções contra Postgres (PGlite)
bash scripts/audit/secret-scan.sh  # segredos
bash scripts/audit/forbidden-texts.sh
```

## Como configurar Supabase (modo real)

1. Crie um projeto Supabase e rode `supabase/migrations/0001..0013` na ordem (CLI: `supabase db push`) ou cole cada arquivo no SQL Editor. A última já instala RLS, grants, RPCs de sync, trigger de criação de perfil e a função de exclusão do titular.
2. Copie `.env.example` → `.env` e preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` (nunca a `service_role` — o app a rejeita em runtime e no lint).
3. Auth: habilite Email (sem "Confirm email" para pilotar; depois habilite SMTP). Habilitar signup gera o e-mail de reset usado por `reset.tsx`.
4. `npx expo start` (sem `EXPO_PUBLIC_DEMO_MODE`) → o app passa a usar cadastro/login reais e sincronização via RPCs `sync_upsert_row`/`sync_soft_delete`.
5. Testes de E2E/RLS de CI rodam contra `.env.test` se fornecido; o harness PGlite dispensa projeto externo.

## Como gerar build

```bash
npx expo prebuild -p android && npx expo run:android --variant release   # ou
eas build -p android  # EAS; requer conta + EXPO_TOKEN (fora deste sandbox)
npx expo export --platform web    # bundle web estático (validado em CI)
```

## PDF / LGPD

Relatório mensal: estatísticas, gráfico, tabela completa (data, hora, valor, unidade, contexto, observação) e dias sem registro — gerado por `expo-print` no aparelho, compartilhado só por toque explícito (ADR 0002). Em Perfil → Dados: exportação JSON dos dados do titular (arquivo local) e exclusão da conta via RPC `delete_own_data` (hard delete + cascade no servidor; apaga espelho local). Nenhuma telemetria/ads/IA-treino.

## Documentação

`docs/ARCHITECTURE.md`, `docs/SECURITY_PRIVACY.md`, `docs/THEME_SYSTEM.md`, `docs/QUALITY_GATES.md` (tabela de resultados), `docs/adr/` (decisões da FASE 1) e `docs/planning/` (auditoria FASE 0).
