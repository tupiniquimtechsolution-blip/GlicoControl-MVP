# ADR 0003 — expo-router em `src/app` (desvio do scaffold) e modo demo gated

**Status:** aceito (FASE 1). **Data:** 2026-09-09.

## Contexto
O guia da Fase 0 previa rotas em `app/` na raiz e nenhum caminho de dados de exemplo público.

## Decisão
1. Manter expo-router em `src/app/` (o projeto já estruturava `src/` + regras de camadas no ESLint
   sobre `src/*`; `app.json`/`tsconfig` alinhados). Preservar a arquitetura verificada > convenção padrão.
2. **Modo demo** só existe quando `EXPO_PUBLIC_DEMO_MODE=demo-local` **e** `__DEV__`. Fora disso,
   login exige Supabase configurado (`isSupabaseConfigured`) — nenhum dado de exemplo em produção;
   em build de produção o ramo é removido pelo bundler.
3. Nunca merge direto na `main` — toda entrega via PR da branch da sessão (`arena/…` → `agent/fullstack-mvp`).

## Consequências
- `npx expo start` funciona sem `.env`; README documenta "Como configurar Supabase" para o modo real.
