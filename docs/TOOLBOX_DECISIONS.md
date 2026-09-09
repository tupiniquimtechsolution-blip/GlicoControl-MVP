# Tupiniquim Toolbox — Decisões do GlicoControl MVP

## Resultado de resolução tecnológica

O Technology Resolution do Tupiniquim favorece **Expo + React Native** para requisitos mobile + TypeScript + cross-platform.

- Expo + React Native: baseline 86; requisito mobile/TypeScript/cross-platform adiciona 7 → **93** quando Node/pnpm estão disponíveis.
- Flutter: baseline 78 e não recebeu sinal específico neste briefing → **78**.

**Decisão:** Expo + React Native + TypeScript.

## Backend/platform

O Toolbox trata Supabase como candidato opcional por projeto, não como dependência global. Neste projeto há decisão arquitetural explícita para adotá-lo por oferecer Postgres, Auth e RLS adequados ao MVP.

**Decisão:** Supabase + Postgres + Auth + RLS.

## Loadout de design

- **UI UX Pro Max:** carregar como referência principal para design system, responsividade, acessibilidade e QA visual.
- **Emil Skills:** carregar apenas para microinterações/animações discretas.
- **Taste Skill:** não usar como baseline porque o app é dashboard/data-heavy e multi-step.

## Engineering quality

Usar Vibe Coding Toolkit seletivamente como playbook:

- brainstorm → plan;
- implementação por fases;
- revisão de código;
- lint/quality gates;
- handoff/documentação.

Não importar regras externas de modo automático.

## Segurança

Aplicar baseline corporativa:

- sem secrets no repositório/bundle/logs;
- autenticação/autorização no backend/banco;
- RLS por paciente;
- validação de inputs;
- rate limiting em autenticação e endpoints sensíveis;
- dependency audit;
- secret scanning;
- SAST quando disponível;
- pentest autorizado antes de produção.

## Ferramentas deliberadamente não carregadas

- Open Generative AI: não necessário ao core do MVP.
- Agent Reach: somente se houver tarefa de pesquisa específica.
- Awesome LLM Apps: IA/RAG não faz parte do MVP.
- CLI-Anything: não necessário como runtime do aplicativo.
