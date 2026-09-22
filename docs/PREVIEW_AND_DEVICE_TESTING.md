# Preview e testes de dispositivo — custo zero

Este documento define o fluxo canônico de acompanhamento do GlicoControl durante o desenvolvimento.

## Regra financeira

- Cloudflare: somente Free / recursos sem cobrança.
- GitHub Actions: somente runners padrão aplicáveis ao repositório público.
- Expo Development Build: gerado pelo GitHub Actions/local, sem EAS Build pago obrigatório.
- Firebase Test Lab: somente projeto Spark e dentro das cotas sem custo.
- Supabase: Free.
- Não vincular billing/Blaze e não ativar add-ons pagos.

---

## 1. GitHub → Cloudflare Pages Preview

A arquitetura canônica atual é:

```text
GitHub → Cloudflare Pages → Preview por branch/PR
```

O Vercel foi usado em uma etapa anterior e agora é legado.

### Build

```text
Build command: npm run build:web
Build output: dist
Root: /
```

O Expo exporta a aplicação web para `dist`.

### Preview demo

Configurar no Cloudflare Pages para previews:

```text
EXPO_PUBLIC_DEMO_MODE=demo-local
```

Não cadastrar service-role, senha ou secret privilegiado do Supabase no preview.

### Headers

O arquivo versionado `public/_headers` é copiado pelo Expo para o build e aplicado pelo Cloudflare Pages aos assets estáticos.

Ele mantém:

- `Cross-Origin-Embedder-Policy: credentialless`;
- `Cross-Origin-Opener-Policy: same-origin`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`.

COOP/COEP são necessários para o contexto web que usa `SharedArrayBuffer`/SQLite.

### Git integration

Com o Pages project conectado a `tupiniquimtechsolution-blip/GlicoControl-MVP`, pushes em branches e PRs podem gerar previews automaticamente.

Durante a fase pré-release:

- `main` não deve ser tratada como release do app até a promoção formal;
- `agent/fullstack-mvp` é a fonte de integração;
- branches/PRs são usadas para preview;
- a Production Branch do Cloudflare deve ser registrada explicitamente no runbook quando confirmada.

### Gate Cloudflare

Registrar antes do release:

- nome exato do Pages project;
- URL canônica `*.pages.dev`;
- branch/commit do deployment;
- HTTP 200;
- COOP/COEP presentes;
- SQLite web funcional;
- welcome/login demo;
- navegação básica;
- preview automático de uma branch/PR.

---

## 2. Android Development Build

Workflow: `.github/workflows/android-development-build.yml`.

Ele:

- usa Node 22 + Java 17 + Android SDK 36;
- instala `expo-dev-client` compatível somente no ambiente de build quando necessário;
- executa `expo prebuild`;
- compila `app-debug.apk`;
- publica artifact temporário.

Com o código clonado no computador:

```bash
npm ci
npx expo start --dev-client --tunnel
```

O Development Build serve para acompanhar mudanças nativas com ciclo rápido; não substitui APK standalone.

---

## 3. Android Standalone Test APK

Gate separado gera release de teste que funciona sem Metro.

Evidência auditada:

- `assembleRelease`: PASS;
- `assets/index.android.bundle`: presente;
- assinatura: validada;
- artifact `glicocontrol-standalone-test-apk`: publicado.

O certificado é de teste/debug e não deve ser usado como assinatura de loja.

---

## 4. Firebase Test Lab

Projeto:

```text
teste-d2d1d
```

Política:

- Spark;
- sem billing/Blaze;
- um dispositivo virtual por matriz manual;
- `EXPO_PUBLIC_DEMO_MODE=demo-local`;
- nenhum dado real de paciente.

Pré-requisitos externos:

1. Cloud Testing API;
2. Cloud Tool Results API;
3. service account exclusiva;
4. Workload Identity Federation para GitHub OIDC;
5. variável `GCP_WORKLOAD_IDENTITY_PROVIDER`;
6. variável `GCP_SERVICE_ACCOUNT`.

Não armazenar chave JSON de service account no repositório.

---

## 5. Maestro Emulator Gate

PR #6 mantém a tentativa de fluxo canônico determinístico no Android Emulator.

Estado: bloqueado no ambiente do runner por interação Metro/React Native DevTools. Não marcar como concluído.

Firebase Robo Test é complementar; não substitui automaticamente o fluxo Maestro.

---

## 6. Dispositivo físico

Obrigatório antes do release:

- notificações;
- PDF;
- compartilhamento;
- deep links;
- Auth real;
- offline/reconnect/sync;
- logout/troca de usuário;
- temas e legibilidade.

---

## Gates

- Web preview: Cloudflare Pages.
- Development Build: comportamento nativo interativo.
- Standalone APK: execução sem Metro.
- Maestro: fluxo determinístico automatizado ou ADR equivalente.
- Firebase Test Lab: compatibilidade hospedada.
- Dispositivo físico: integrações e comportamento real.

Nenhum desses gates, isoladamente, autoriza promoção para `main`.
