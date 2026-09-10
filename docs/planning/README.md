# Planeamento da Fase 0 — Registro de Auditoria e Plano

Este diretório contém o resultado verificável da **FASE 0 (Auditoria e Planejamento)**
exigida por `PROMPT_AGENT_FULLSTACK.md` §27 e pela **Issue #1** (primeiro gate).

> Gate da Issue #1: "Nenhum backend/frontend de produção deve ser declarado pronto
> antes de concluir e documentar esta fase." — Nenhum produto de código foi declarado
> pronto nesta fase; foram produzidos apenas diagnóstico, plano e um script de auditoria.

## Conteúdo

| Documento | Itens do gate cobertos |
| --- | --- |
| [PHASE0-AUDIT.md](./PHASE0-AUDIT.md) | 1. Diagnóstico do estado inicial (evidências reais) |
| [PHASE0-ARCHITECTURE.md](./PHASE0-ARCHITECTURE.md) | 2. Arquitetura definida (camadas, pacotes, versões) |
| [PHASE0-DATA-MODEL.md](./PHASE0-DATA-MODEL.md) | 3. Modelo de dados (entidades, constraints, decisões) |
| [PHASE0-RLS.md](./PHASE0-RLS.md) | 4. Estratégia de RLS e testes de isolamento |
| [PHASE0-OFFLINE-SYNC.md](./PHASE0-OFFLINE-SYNC.md) | 5. Estratégia offline/sincronização |
| [PHASE0-NAVIGATION-UX.md](./PHASE0-NAVIGATION-UX.md) | 6. Navegação e fluxos UX (+ temas e acessibilidade) |
| [PHASE0-BACKLOG.md](./PHASE0-BACKLOG.md) | 7. Backlog por fases + 8. Critérios de aceite |
| [PHASE0-RISKS.md](./PHASE0-RISKS.md) | 9. Riscos técnicos, de segurança, privacidade e acessibilidade |
| [PHASE0-AUDIT.md § Próximos passos](./PHASE0-AUDIT.md#próximos-passos) | 10. Próximos passos (plano verificável da Fase 1) |

## Artefatos executáveis

- `scripts/audit/contrast-audit.mjs` — reproduz a verificação de estrutura de temas e
  contraste WCAG AA usada na auditoria: `node scripts/audit/contrast-audit.mjs`
  (resultado medido na Fase 0: **PASS, 0 falhas**; ver PHASE0-AUDIT.md).

## Como este plano se relaciona com os documentos existentes

Os documentos raiz (`docs/PRODUCT_SCOPE.md`, `docs/ARCHITECTURE.md`,
`docs/SECURITY_PRIVACY.md`, `docs/THEME_SYSTEM.md`, `docs/TOOLBOX_DECISIONS.md`,
`docs/QUALITY_GATES.md`, `AGENTS.md`) permanecem a **autoridade de decisões**.
Estes documentos de planejamento apenas **concretizam e detalham** as decisões para
implementação, sem alterá-las. Havendo conflito, prevalece o documento raiz +
`AGENTS.md`, e o conflito deve ser registrado como pendência.
