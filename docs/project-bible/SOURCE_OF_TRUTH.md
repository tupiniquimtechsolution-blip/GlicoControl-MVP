# Source of Truth — IDs, Branches, Serviços e Evidências

**Data-base:** 2026-09-22

Este documento impede que agentes futuros reconstruam o projeto a partir de memória incompleta.

---

# 1. Ordem de autoridade

1. GitHub — código/commit/PR/workflow;
2. Supabase real — schema/policies/advisors/testes;
3. documentação versionada;
4. Notion/Agenor;
5. Miro;
6. chat/memória auxiliar.

Se uma fonte inferior contradizer uma superior, registrar a divergência e corrigir a gestão/documentação.

---

# 2. GitHub

```text
repo: tupiniquimtechsolution-blip/GlicoControl-MVP
visibility: public
production branch: main
integration branch: agent/fullstack-mvp
```

Estado auditado da branch de integração na abertura desta Bíblia:

```text
HEAD: 8c90ec8e8b83111472e46b0c043196c3dba81a37
contexto: merge do PR #7
```

A Bíblia é produzida em:

```text
chatgpt/project-bible-2026-09
```

## PRs relevantes

| PR | Tema | Estado canônico |
|---:|---|---|
| #2 | Fase 0 + Fase 1 + hardening | Merged em integration |
| #3 | Supabase live integration | Merged |
| #4 | Android native gate | Merged |
| #5 | Auth PKCE + privacy | Merged |
| #6 | Maestro emulator E2E | Aberto / bloqueado |
| #7 | Preview + Dev Build + Test infra | Merged; Vercel hoje legado |
| #8 | Firebase Test Lab | Draft / em andamento |

## Issue principal

Issue #1 — Fase 0 — fechada como completed.

---

# 3. Supabase

```text
project name: GlicoControl-MVP
project ref: bvyhtoimcprhfmbyrsoi
region: sa-east-1
plan: Free
```

Migrations conhecidas aplicadas:

```text
0001 … 0015
```

### Evidências reais

- RLS A×B gerenciado PASS;
- rollback limpo;
- grants anon/auth verificados;
- RPC sync statuses verificados;
- advisors tratados;
- security definer warnings remanescentes documentados/intencionais.

### Não armazenar aqui

- service-role;
- senhas;
- tokens;
- secrets.

---

# 4. Firebase / Google Cloud

```text
Firebase project id: teste-d2d1d
plan: Spark
billing: proibido
```

Estado:

- projeto criado;
- workflow Test Lab existente no PR #8;
- standalone APK PASS;
- APIs/WIF/repository variables pendentes;
- primeira Robo matrix pendente.

Variáveis esperadas no GitHub:

```text
GCP_WORKLOAD_IDENTITY_PROVIDER
GCP_SERVICE_ACCOUNT
```

Não usar chave JSON persistente.

---

# 5. Cloudflare

Cloudflare Pages é a camada web canônica desde a migração global informada pelo proprietário em setembro/2026.

Configuração esperada:

```text
repo: tupiniquimtechsolution-blip/GlicoControl-MVP
build: npm run build:web
output: dist
preview env: EXPO_PUBLIC_DEMO_MODE=demo-local
plan: Free
```

Informação ainda a capturar no repositório:

- nome exato do Pages project;
- URL `*.pages.dev`;
- Production Branch configurada;
- último deployment/commit validado.

Até essas evidências serem registradas, tratar a migração como **decisão confirmada**, mas a validação específica do GlicoControl como pendente.

---

# 6. Vercel — legado

Vercel foi usado para preview durante uma etapa anterior.

Estado canônico atual:

```text
LEGADO / NÃO OPERACIONAL PARA O PROJETO
```

Qualquer `vercel.json`, URL ou documentação Vercel não deve ser usada como fonte de deployment atual após a migração Cloudflare.

---

# 7. Android

Package canônico:

```text
app.tupiniquim.glicocontrol
```

SDK baseline validada:

```text
Expo SDK 57
React Native 0.86.x
Node 22
Java 17
Android compile/target 36
NDK 27.1.12297006
```

## Standalone APK

Evidência auditada:

```text
GitHub Actions job: 103545470381
assembleRelease: PASS
bundle: assets/index.android.bundle presente
signature verify: PASS
artifact: glicocontrol-standalone-test-apk
```

O certificado é de teste/debug; não usar como assinatura de loja.

---

# 8. Notion / Agenor

Projeto existente:

```text
Projeto: GlicoControl-MVP
Notion project page id: 3de18931-0488-8149-91b4-cdefc4ef0d85
```

Na auditoria, o registro estava incorretamente como `Pausado/INACTIVE`. O projeto está ativo e deve ser reconciliado.

Tasks data source:

```text
collection://86140744-b560-404c-9ac6-170975c1e596
```

Protocolo Agenor:

- status: Caixa de Entrada / A Fazer / Em Andamento / Aguardando / Bloqueada / Concluída;
- prioridade: Crítica / Alta / Média / Baixa;
- `Sequência` estável;
- relação obrigatória com o projeto.

---

# 9. Miro

Board canônico:

```text
Central Tupiniquim Visual
https://miro.com/app/board/uXjVHl4fqwQ=/
```

Miro é visualização operacional, não substitui GitHub ou Notion.

---

# 10. Documentação técnica preservada

Não apagar/reescrever silenciosamente:

- `docs/planning/PHASE0-*`;
- `docs/ARCHITECTURE.md`;
- `docs/PRODUCT_SCOPE.md`;
- `docs/QUALITY_GATES.md`;
- `docs/SECURITY_PRIVACY.md`;
- `docs/SUPABASE_LIVE.md`;
- `docs/THEME_SYSTEM.md`;
- `docs/TOOLBOX_DECISIONS.md`;
- ADRs.

A Bíblia é uma camada de consolidação e governança sobre essas fontes.

---

# 11. Política para atualizar este mapa

Atualizar imediatamente quando mudar:

- branch/HEAD de integração;
- plataforma de deploy;
- projeto Supabase/Firebase;
- package id;
- major SDK/runtime;
- gate de release;
- PR crítico;
- status de produção;
- custo/plano de serviço.
