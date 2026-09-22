# GlicoControl MVP

Aplicativo mobile-first para registro e organização de medições de glicemia, lembretes configuráveis de medições/medicações, histórico/calendário, adesão e relatório mensal em PDF para apresentação ao profissional de saúde.

> **Documento mestre:** [`PROJECT_BIBLE.md`](PROJECT_BIBLE.md)  
> **Roadmap/Waves:** [`docs/project-bible/ROADMAP_WAVES.md`](docs/project-bible/ROADMAP_WAVES.md)  
> **Precificação/valuation:** [`docs/project-bible/COMMERCIAL_PRICING.md`](docs/project-bible/COMMERCIAL_PRICING.md)

## Estado atual

O MVP full-stack está substancialmente implementado e passou por hardening de CI/segurança, Supabase real, RLS A×B, Auth PKCE, Android Native Gate, Development Build e APK standalone com JS bundle embutido.

**Ainda não está autorizado promover para `main`.** Restam gates finais de Cloudflare Pages pós-migração, Auth real end-to-end, dispositivo Android físico, decisão/correção do Maestro E2E e primeira matriz Firebase Test Lab.

Branch de integração:

```text
agent/fullstack-mvp
```

Produção:

```text
main  # bloqueada até os release gates finais
```

Deployment web canônico:

```text
Cloudflare Pages
```

O Vercel é legado e não é mais fonte operacional do projeto.

## Boundary clínico

O app **não** faz:

- diagnóstico;
- prescrição;
- cálculo/recomendação de dose ou insulina;
- ajuste automático de tratamento;
- substituição de orientação profissional.

O produto registra, organiza, lembra e reporta dados informados/configurados pelo usuário.

## Stack

- Expo SDK 57 / React Native 0.86 / TypeScript;
- Expo Router;
- `expo-sqlite` offline-first;
- Supabase Postgres/Auth/RLS;
- PKCE;
- `expo-notifications`;
- `expo-print` + `expo-sharing`;
- Jest/Testing Library;
- Maestro para E2E determinístico;
- Firebase Test Lab Spark para validação hospedada;
- Cloudflare Pages para web preview.

## Como executar

### Demo local

```bash
npm ci
EXPO_PUBLIC_DEMO_MODE=demo-local npx expo start
```

### Supabase real

Use `.env` local com apenas variáveis client-side necessárias:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Nunca use `service_role` no app.

Projeto gerenciado auditado:

```text
Supabase ref: bvyhtoimcprhfmbyrsoi
migrations: 0001–0015
```

Callbacks PKCE:

```text
glicocontrol://auth-confirm
glicocontrol://auth-recovery
```

## Quality gates

```bash
npm test
npm run typecheck
npm run lint
bash scripts/rls/run-local.sh
bash scripts/audit/secret-scan.sh
bash scripts/audit/forbidden-texts.sh
npm run build:web
```

Além disso, o repositório possui workflows para:

- Android Native Gate;
- Development Build;
- Standalone Test APK;
- Maestro Emulator Gate;
- Firebase Test Lab.

## Web preview — Cloudflare

Build:

```text
npm run build:web
```

Output:

```text
dist
```

O arquivo `public/_headers` é copiado ao `dist` e mantém os headers necessários para SQLite/SharedArrayBuffer no Cloudflare Pages.

Preview/demo deve usar:

```text
EXPO_PUBLIC_DEMO_MODE=demo-local
```

## Android standalone

O gate release de teste já comprovou:

- `assembleRelease` PASS;
- `assets/index.android.bundle` presente;
- APK assinado para teste;
- artifact publicado.

Esse APK não é assinatura de loja.

## Firebase Test Lab

Projeto dedicado:

```text
teste-d2d1d
```

Regra: Spark, sem billing/Blaze, um dispositivo virtual por matriz manual.

Setup WIF/APIs ainda é parte da wave ativa; veja [`docs/project-bible/ROADMAP_WAVES.md`](docs/project-bible/ROADMAP_WAVES.md).

## PDF / privacidade

O relatório mensal é gerado localmente com `expo-print` e compartilhado somente por ação explícita. Perfil/Dados cobre exportação e exclusão. O logout limpa dados locais conhecidos da conta anterior.

## Documentação

### Canônica

- `PROJECT_BIBLE.md`
- `PROMPT_PROJECT_MANAGER_10Y.md`
- `docs/project-bible/ROADMAP_WAVES.md`
- `docs/project-bible/COMMERCIAL_PRICING.md`
- `docs/project-bible/RISK_GOVERNANCE.md`
- `docs/project-bible/OPERATIONS_RELEASE.md`
- `docs/project-bible/AGENOR_HANDOFF.md`
- `docs/project-bible/SOURCE_OF_TRUTH.md`

### Técnica especializada

- `docs/ARCHITECTURE.md`
- `docs/SECURITY_PRIVACY.md`
- `docs/THEME_SYSTEM.md`
- `docs/QUALITY_GATES.md`
- `docs/SUPABASE_LIVE.md`
- `docs/adr/`
- `docs/planning/`

Os documentos de Fase 0 são preservados como histórico e detalhe; a Bíblia é a camada consolidada de governança.
