# Operações, Ambientes, Deploy e Release Runbook

**Projeto:** GlicoControl-MVP  
**Data-base:** 2026-09-22

---

# 1. Topologia operacional

```text
GitHub
  ├─ CI / Quality Gates
  ├─ Android Native Gate
  ├─ Development Build
  ├─ Standalone Test APK
  └─ branches / PRs
       │
       ├─> Cloudflare Pages (web preview/demo)
       │
       ├─> Supabase Free (backend real de dev/teste)
       │
       └─> Firebase Test Lab Spark (Android validation)
```

---

# 2. Ambientes

## Local

Uso:

- desenvolvimento;
- testes unitários;
- Expo Dev Client;
- debug de UI;
- validação de SQLite/offline.

Variáveis públicas esperadas, conforme necessidade:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_DEMO_MODE
```

Nunca usar service-role no app.

## Web preview

Plataforma canônica: **Cloudflare Pages Free**.

Objetivo:

- acompanhar evolução visual;
- testar navegação web;
- demo sem dados reais;
- preview por branch/PR.

Build esperado:

```bash
npm ci --no-audit --no-fund
npm run build:web
```

Output:

```text
dist
```

Env de preview:

```text
EXPO_PUBLIC_DEMO_MODE=demo-local
```

Headers necessários para assets estáticos e SQLite web:

```text
Cross-Origin-Embedder-Policy: credentialless
Cross-Origin-Opener-Policy: same-origin
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

Esses headers devem ser versionados por `public/_headers` para que sejam copiados ao `dist` pelo Expo export e aplicados pelo Cloudflare Pages.

## Backend dev/teste

Supabase:

```text
project: GlicoControl-MVP
ref: bvyhtoimcprhfmbyrsoi
region: sa-east-1
plan: Free
```

Usar apenas dados sintéticos/teste durante validações automatizadas.

## Android hospedado

GitHub Actions:

- standard runner aplicável;
- Node 22;
- Java 17;
- Android SDK 36;
- NDK 27.1.12297006.

Firebase:

```text
project id: teste-d2d1d
plan: Spark
billing: proibido
```

---

# 3. Artefatos Android

## Debug APK

Prova de compilação nativa. Pode depender de Metro dependendo do fluxo.

## Development Client

Usado para desenvolvimento interativo com `expo-dev-client`.

No computador:

```bash
npm ci
npx expo start --dev-client --tunnel
```

## Standalone Test APK

Release de teste com JS bundle embutido.

Gate já comprovado:

- `assembleRelease` PASS;
- `assets/index.android.bundle` presente;
- APK assinado com debug keystore de teste;
- artifact publicado.

Não usar como release de loja.

---

# 4. Cloudflare Pages — configuração canônica

## Integração Git

Conectar ao repositório:

```text
tupiniquimtechsolution-blip/GlicoControl-MVP
```

Configuração esperada:

```text
Framework preset: nenhum/compatível com build customizado
Root directory: /
Build command: npm run build:web
Build output directory: dist
```

### Branching

Enquanto `main` ainda não contém o produto validado:

- usar previews de branches/PRs para acompanhar desenvolvimento;
- não interpretar URL de produção antiga como release aprovado;
- decidir explicitamente qual branch será Production Branch durante a transição;
- quando `main` for promovida, alinhar Production Branch com a estratégia final.

### Variáveis

Preview/demo:

```text
EXPO_PUBLIC_DEMO_MODE=demo-local
```

Não colocar credenciais privilegiadas Supabase no Pages.

### Gate Cloudflare

Registrar:

- URL `*.pages.dev`;
- branch/commit implantado;
- HTTP 200;
- headers COOP/COEP;
- carregamento de SQLite web;
- welcome/login demo;
- navegação básica;
- preview automático por PR/branch.

---

# 5. Supabase runbook

## Migrations

Regra: append-only.

Antes de aplicar nova migration:

1. revisar SQL;
2. avaliar RLS/grants;
3. executar teste local quando possível;
4. aplicar em projeto gerenciado;
5. rodar advisors;
6. documentar exceções intencionais;
7. atualizar tipos se o schema público mudar.

## RLS

Para mudanças de dados/policies repetir cenário A×B:

- A vê A;
- A não vê B;
- A não atualiza B;
- A não apaga B;
- A não insere forjando owner B;
- rollback/cleanup.

## Auth

Callbacks canônicos:

```text
glicocontrol://auth-confirm
glicocontrol://auth-recovery
```

Provar em release gate:

- signup;
- confirmação;
- recovery;
- troca PKCE;
- logout;
- limpeza local.

---

# 6. Firebase Test Lab runbook

Workflow:

```text
.github/workflows/firebase-testlab.yml
```

Regras:

- manual (`workflow_dispatch`);
- projeto `teste-d2d1d`;
- Spark;
- sem billing;
- um dispositivo virtual por execução;
- demo-local;
- nenhuma informação real de paciente.

Pré-requisitos externos:

- Cloud Testing API;
- Cloud Tool Results API;
- service account exclusiva;
- Workload Identity Federation;
- `GCP_WORKLOAD_IDENTITY_PROVIDER`;
- `GCP_SERVICE_ACCOUNT`.

### Primeiro gate

Executar Robo Test com default conservador. Confirmar modelo/API disponíveis antes do disparo se catálogo tiver mudado.

Se cota gratuita não estiver disponível:

**não habilitar billing; aguardar cota.**

---

# 7. Dispositivo físico — roteiro mínimo

## Instalação

- instalar APK/Development Client apropriado;
- confirmar package `app.tupiniquim.glicocontrol`;
- limpar app state antes do teste crítico.

## Auth

- criar conta de teste;
- confirmar e-mail;
- entrar;
- recovery;
- logout;
- segunda conta;
- verificar ausência de dados da primeira.

## Medição

- criar;
- editar;
- apagar;
- consultar calendário;
- consultar histórico.

## Offline

- registrar online;
- entrar offline;
- criar/editar offline;
- reiniciar app;
- reconectar;
- esperar sync;
- validar banco e UI.

## Lembretes

- solicitar permissão quando aplicável;
- criar lembrete;
- verificar agendamento;
- desativar/editar;
- validar comportamento após restart.

## Medicamentos

- cadastrar;
- configurar agenda;
- registrar adesão;
- validar `nextDue`.

## PDF

- abrir relatório mensal;
- gerar PDF;
- abrir documento;
- compartilhar;
- checar caracteres, conteúdo, conta e privacidade.

---

# 8. Release checklist

## Produto

- [ ] escopo clínico intacto;
- [ ] fluxos principais OK;
- [ ] nenhum placeholder/TODO permanente de release.

## Código

- [ ] lint;
- [ ] typecheck;
- [ ] testes;
- [ ] dependency audit;
- [ ] secret scan;
- [ ] forbidden text scan.

## Backend

- [ ] migrations aplicadas;
- [ ] RLS A×B;
- [ ] grants/RPC;
- [ ] advisors revisados;
- [ ] Auth real.

## Web

- [ ] Cloudflare build;
- [ ] `dist`;
- [ ] headers;
- [ ] preview;
- [ ] demo;
- [ ] rotas.

## Android

- [ ] Native Gate;
- [ ] standalone APK;
- [ ] E2E/ADR equivalente;
- [ ] Test Lab;
- [ ] dispositivo físico.

## Privacidade

- [ ] exportação;
- [ ] exclusão;
- [ ] logout wipe;
- [ ] multi-account isolation;
- [ ] PDF correto.

## Gestão

- [ ] Bíblia atualizada;
- [ ] Agenor/Notion atualizado;
- [ ] Miro atualizado;
- [ ] riscos revisados;
- [ ] release notes.

---

# 9. Procedimento para promoção `agent/fullstack-mvp → main`

1. congelar mudanças não relacionadas;
2. registrar HEAD candidato;
3. executar todos os gates finais;
4. resolver PRs abertos conflitantes;
5. gerar relatório de release;
6. abrir PR para `main`;
7. revisar diff completo;
8. não fazer force push;
9. merge somente após evidências;
10. criar tag/release quando aplicável;
11. validar deployment pós-merge;
12. atualizar Agenor e Miro.

---

# 10. Rollback

## Web

Voltar deployment/commit anterior no Cloudflare/Git após identificar regressão.

## App

Enquanto distribuição for por APK de teste, reinstalar artifact anterior conhecido. Após loja, definir estratégia própria de versionCode/release.

## Backend

Migrations são append-only. Não editar migration aplicada. Criar migration corretiva/compensatória após análise de dados.

## Auth/security

Incidente de segurança tem prioridade sobre roadmap. Revogar/rotacionar credencial comprometida e documentar impacto sem expor secret.

---

# 11. Observabilidade mínima antes do piloto

Sem introduzir coleta invasiva, precisamos conseguir responder:

- app está crashando?;
- sync está falhando?;
- Auth está falhando?;
- relatório falha?;
- versão/build instalada?;

Qualquer ferramenta de analytics/crash reporting nova exige revisão de privacidade e custo antes da instalação.
