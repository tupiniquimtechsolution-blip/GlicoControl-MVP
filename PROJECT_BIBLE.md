# GlicoControl-MVP — BÍBLIA CANÔNICA DO PROJETO

> **Status documental:** CANÔNICO / vivo  
> **Data-base desta auditoria:** 2026-09-22  
> **Repositório:** `tupiniquimtechsolution-blip/GlicoControl-MVP`  
> **Branch de integração:** `agent/fullstack-mvp`  
> **Branch de produção:** `main` — promoção ainda bloqueada por gates finais  
> **Regra financeira operacional:** R$ 0 / US$ 0 sem autorização explícita  
> **Deployment web canônico:** Cloudflare Pages  
> **Backend gerenciado:** Supabase Free  
> **Validação Android:** GitHub Actions + Development Build + APK standalone + Firebase Test Lab Spark

---

## 1. Resumo executivo

O **GlicoControl-MVP** é um aplicativo mobile-first para organização pessoal do acompanhamento glicêmico. O produto permite registrar medições, consultar histórico/calendário, configurar lembretes, organizar medicamentos e adesão, gerar relatório mensal em PDF e manter os dados disponíveis offline com sincronização posterior.

O produto foi deliberadamente desenhado como **ferramenta de registro, organização, lembrete e compartilhamento**, e não como sistema de diagnóstico ou prescrição.

O MVP full-stack está substancialmente implementado e passou por hardening de segurança, Supabase real, RLS, PKCE, builds Android e geração de APK standalone. O projeto ainda **não está liberado para promoção a `main`**, pois restam gates de validação operacional: reconciliação final do deploy Cloudflare, Auth real/end-to-end, E2E Android determinístico/alternativa equivalente, validação física de notificações/PDF/offline e execução real do Firebase Test Lab.

### Estado macro

| Dimensão | Estado | Observação |
|---|---|---|
| Produto/MVP | ✅ substancialmente concluído | fluxos principais implementados |
| Backend/Supabase | ✅ concluído e endurecido | migrations 0001–0015, RLS real validado |
| Segurança/LGPD | ✅ baseline concluída | gates finais continuam antes de produção |
| Auth PKCE | ✅ implementação concluída | callback real/allowlist e fluxo real ainda precisam validação final |
| Android native build | ✅ concluído | debug/dev/standalone comprovados |
| APK standalone | ✅ concluído | release com bundle JS e assinatura verificados |
| Maestro E2E em emulador | ⛔ bloqueado | infraestrutura Metro/DevTools no runner; PR #6 aberto |
| Cloudflare Pages | 🟡 migração informada/concluída externamente | repo/docs ainda precisam reconciliação pós-Vercel |
| Firebase Test Lab | 🟡 em andamento | APK pronto; WIF/APIs + primeira matriz pendentes |
| Dispositivo físico | ⬜ pendente | notificações, PDF/share, offline/reconnect |
| Promoção para `main` | ⛔ bloqueada | somente após gates finais |
| Piloto/comercialização | ⬜ futura | iniciar após release candidate validado |

---

## 2. Problema que o produto resolve

Pessoas que acompanham glicemia frequentemente precisam consolidar informações dispersas entre anotações, alarmes, histórico e relatórios enviados ao profissional de saúde. O GlicoControl centraliza esse processo em uma experiência única, com foco em:

- registro rápido;
- histórico consultável;
- lembretes configuráveis;
- organização de medicamentos e adesão;
- relatório mensal compartilhável;
- disponibilidade offline;
- privacidade por padrão.

### Proposta de valor

**“Registrar, organizar, lembrar e compartilhar informações de acompanhamento glicêmico com simplicidade e privacidade, sem tentar substituir decisão clínica.”**

---

## 3. Público e personas

### Persona primária — usuário/paciente

Necessita registrar glicemia, lembrar rotinas, acompanhar histórico e levar um relatório organizado para consulta.

### Persona secundária — familiar/cuidador

Pode auxiliar na organização da rotina, sem assumir papel clínico. Funcionalidades multiusuário/família não pertencem ao MVP atual e exigem desenho de permissões antes de implementação.

### Persona de contexto — profissional de saúde

Recebe relatório exportado pelo usuário. O MVP **não fornece portal clínico**, prontuário, prescrição ou decisão automatizada.

---

## 4. Escopo funcional do MVP

### Incluído

- cadastro/login e sessão;
- confirmação/recuperação de conta por PKCE;
- perfil e preferências;
- registro CRUD de glicemia;
- data, hora e período/contexto;
- histórico e calendário mensal;
- metas configuradas pelo próprio usuário/profissional, sem recomendação automática;
- lembretes de medições;
- cadastro de medicamentos;
- agenda e registro de adesão;
- relatório mensal;
- PDF e compartilhamento;
- temas/identidade visual;
- armazenamento local SQLite;
- outbox/sincronização;
- isolamento RLS no Supabase;
- exportação/exclusão de dados;
- modo demo/local para previews e testes.

### Fora do escopo clínico

É proibido introduzir no MVP sem nova decisão formal:

- diagnóstico;
- interpretação clínica automática;
- recomendação de medicamento;
- prescrição;
- interrupção de medicamento;
- cálculo/recomendação de insulina;
- alteração automática de tratamento;
- classificação de emergência como diagnóstico;
- chatbot clínico/LLM de aconselhamento.

Valores extremos podem solicitar apenas confirmação de entrada, por exemplo: **“Confirme se o valor informado está correto.”**

---

## 5. Arquitetura canônica

### Aplicação

- Expo / React Native / TypeScript;
- Expo Router;
- React Native 0.86.x / Expo SDK 57 baseline atual;
- temas semânticos;
- `expo-sqlite` para offline;
- `expo-notifications` para lembretes;
- `expo-print` + `expo-sharing` para relatórios.

### Backend

- Supabase Postgres;
- Supabase Auth;
- RLS por `auth.uid()`;
- RPCs controladas para sync/account deletion;
- migrations versionadas;
- região São Paulo (`sa-east-1`);
- plano Free, sem recursos pagos.

### Web/preview

Arquitetura canônica atual:

`GitHub → Cloudflare Pages → Preview por branch/PR`

Build:

```text
npm run build:web
```

Output:

```text
dist
```

Preview deve usar:

```text
EXPO_PUBLIC_DEMO_MODE=demo-local
```

A migração substitui o Vercel como camada operacional de preview. Qualquer `vercel.json` ou referência antiga é legado a ser removido/reconciliado.

### Android/testes

`GitHub Actions → Android Native Gate → Development Client/APK → Standalone Test APK → Firebase Test Lab`

---

## 6. Sistema de temas

IDs canônicos:

1. `pastelCalm` — Pastel Calm;
2. `greenWhite` — Verde/Branco — padrão;
3. `yellowWhite` — Amarelo/Branco;
4. `blackWhite` — Preto/Branco;
5. `blackYellow` — Preto/Amarelo.

Regras:

- tokens semânticos;
- contraste auditado;
- informação clínica/estado nunca depende apenas de cor;
- temas não podem alterar significado funcional.

---

## 7. Dados, segurança e LGPD

Dados de saúde são sensíveis. O projeto adota como baseline:

- mínimo necessário de dados;
- RLS em todas as tabelas expostas;
- isolamento por usuário;
- Auth PKCE;
- sem service-role no cliente;
- sem secrets no Git;
- exclusão de dados do usuário;
- limpeza de dados locais no logout;
- exportação controlada;
- logs sem conteúdo sensível desnecessário;
- sincronização com prevenção de escrita forjada entre usuários;
- políticas auditáveis por migrations.

### Supabase real

Projeto real: `GlicoControl-MVP`  
Ref: `bvyhtoimcprhfmbyrsoi`  
Plano: Free  
Migrations aplicadas: `0001`–`0015`.

Evidências já concluídas:

- RLS em tabelas de paciente;
- teste A×B no Supabase gerenciado com rollback limpo;
- usuário A não lê/edita/apaga dados de B;
- insert forjado para B rejeitado;
- privilégios de RPC explicitamente endurecidos;
- advisors de segurança/performance tratados, exceto avisos intencionais/documentados;
- status reais de sync validados: `applied`, `skipped-stale`, `parent-missing`.

---

## 8. Autenticação

Baseline atual:

- fluxo PKCE;
- callback de confirmação: `glicocontrol://auth-confirm`;
- callback de recuperação: `glicocontrol://auth-recovery`;
- callback troca apenas `code` por sessão;
- links contendo somente `access_token`/`refresh_token` do antigo fluxo implícito são rejeitados;
- confirmação e recovery não podem usar a rota uma da outra.

### Gate ainda necessário

Validar end-to-end em ambiente real:

1. allowlist das duas URLs no Supabase Auth;
2. cadastro real;
3. confirmação de e-mail;
4. login pós-confirmação;
5. recuperação de senha;
6. logout e wipe local;
7. reconexão sem vazamento de contexto do usuário anterior.

---

## 9. Offline e sincronização

Modelo:

- SQLite local como camada de disponibilidade;
- outbox para mutações;
- sync posterior;
- conflitos tratados no backend;
- status de RPC não são convertidos falsamente em sucesso.

O gateway foi corrigido após auditoria real: o banco retorna texto, e o cliente agora diferencia `applied`, `skipped-stale` e `parent-missing` corretamente.

### Gate físico pendente

Executar em Android real:

`online → registrar → offline → registrar/editar → fechar/reabrir → reconectar → sincronizar → validar servidor e UI`.

---

## 10. Relatórios e PDF

O relatório mensal deve permanecer descritivo e não clínico. Deve conter, quando aplicável:

- período;
- registros de glicemia;
- datas/horários/contextos;
- resumo descritivo;
- medicamentos/adesão dentro do escopo aprovado;
- identificação mínima necessária do usuário.

Gate físico pendente:

- gerar PDF no aparelho;
- abrir arquivo;
- compartilhar via share sheet;
- validar acentuação, paginação, legibilidade e ausência de vazamento entre contas.

---

## 11. Qualidade e evidências já conquistadas

Baseline conhecida no CI após hardening:

- Node 22;
- lint PASS;
- TypeScript PASS;
- Jest PASS sem `--forceExit`;
- 12 suites / 79 testes no marco de integração tipada;
- RLS SQL real/local PASS;
- contraste dos temas PASS;
- secret scan PASS;
- forbidden clinical text scan PASS;
- web export PASS;
- Android `assembleDebug` PASS;
- Development Build PASS;
- APK standalone release PASS;
- bundle JS standalone confirmado dentro do APK;
- assinatura do APK de teste confirmada.

### Débito conhecido

Dependências transitivas já apresentaram vulnerabilidades `moderate` ligadas ao ecossistema Expo/Router; não foi aplicado `npm audit fix --force` porque introduziria downgrade/breaking change. Política: nenhuma vulnerabilidade high/critical é aceita silenciosamente.

---

## 12. Ambientes

### Local/dev

- código local;
- Supabase configurável via env;
- demo local disponível para preview/testes;
- nenhuma chave privilegiada no app.

### Preview web

- Cloudflare Pages;
- branch/PR preview;
- modo demo local;
- sem dados reais de paciente.

### Backend de desenvolvimento real

- Supabase Free `bvyhtoimcprhfmbyrsoi`;
- dados de teste/sintéticos para validações.

### Testes Android hospedados

- GitHub Actions standard runners do repositório público;
- Firebase projeto `teste-d2d1d` no Spark;
- sem billing/Blaze;
- Test Lab manual, uma matriz virtual por execução.

---

## 13. Branching e promoção

### Fonte de integração

`agent/fullstack-mvp`

### Produção

`main`

### Regra

Não promover para `main` até todos os release gates obrigatórios estarem verdes no mesmo estado coerente do produto.

PRs importantes:

- #2 — Fase 0 + Fase 1 + hardening — merged em `agent/fullstack-mvp`;
- #3 — integração Supabase live — merged;
- #4 — Android native gate — merged;
- #5 — Auth PKCE/privacidade — merged;
- #6 — Maestro emulator gate — **aberto/bloqueado**;
- #7 — preview/dev-build/test infra — merged, porém parte Vercel hoje é legado após migração Cloudflare;
- #8 — Firebase Test Lab — **draft/em andamento**; standalone APK já verde, WIF/APIs/matriz real pendentes.

---

## 14. Roadmap por waves

A fonte detalhada é `docs/project-bible/ROADMAP_WAVES.md`.

Resumo:

- **W0 — Governança/Fase 0:** concluída;
- **W1 — MVP full-stack:** concluída;
- **W2 — Hardening CI/segurança/LGPD:** concluída;
- **W3 — Supabase real/RLS/sync:** concluída;
- **W4 — Auth PKCE/privacidade:** implementação concluída; validação real final pendente;
- **W5 — Android build pipeline:** concluída;
- **W6 — E2E/dispositivo:** em andamento/bloqueada parcialmente;
- **W7 — Cloudflare preview pós-migração:** em andamento;
- **W8 — Firebase Test Lab:** em andamento/aguardando configuração externa;
- **W9 — Release Candidate/main:** bloqueada pelos gates W4/W6/W7/W8;
- **W10 — Piloto/comercialização:** futura.

---

## 15. Valor econômico e comercial

A fonte detalhada é `docs/project-bible/COMMERCIAL_PRICING.md`.

### Faixa de reposição técnica estimada

Com benchmark 2026 de desenvolvimento React Native/app entre aproximadamente US$24–49/h em mercados freelance/agência e esforço equivalente estimado entre 950–1.480 horas para reconstruir produto, backend, offline sync, segurança, QA e documentação, a ordem de grandeza de reposição fica em aproximadamente:

**R$ 120 mil – R$ 340 mil**.

Faixa comercial central de referência para negociação de ativo/projeto maduro:

**R$ 150 mil – R$ 300 mil**, dependendo de direitos, exclusividade, suporte, garantias, documentação entregue e propriedade intelectual.

> Não é laudo de valuation, oferta vinculante nem avaliação contábil. É benchmark de custo de reposição/comercialização com data-base 2026-09-22.

### Monetização B2C — hipótese futura

Para a proposta atual sem hardware, tiras, coaching ou serviço clínico:

- Free: registro/histórico essencial;
- Pro: referência inicial **R$14,90–R$24,90/mês**;
- anual: referência inicial **R$149–R$199/ano**.

Essas faixas precisam ser validadas em piloto e pesquisa com usuários antes de decisão comercial.

---

## 16. Política de custo operacional

A regra atual do proprietário é absoluta:

**nenhuma plataforma ou etapa pode gerar cobrança sem autorização explícita.**

Permitido hoje:

- GitHub público / standard runners dentro das condições gratuitas aplicáveis;
- Cloudflare Free;
- Supabase Free;
- Firebase Spark/Test Lab dentro da cota gratuita;
- ferramentas locais/open source.

Bloqueado sem nova autorização:

- Supabase Pro/add-ons/branching/PITR/custom domain pago;
- Cloudflare plano pago/add-ons pagos;
- Firebase Blaze/billing;
- EAS Build pago;
- runners pagos/larger runners;
- publicação em loja que exija taxa;
- qualquer overage ou recurso com custo não zero.

---

## 17. Riscos principais

### R1 — validação física incompleta

**Impacto:** alto.  
**Mitigação:** concluir W6 antes de release.

### R2 — Maestro hospedado ainda bloqueado

**Impacto:** médio/alto para automação regressiva.  
**Causa conhecida:** interação Metro/DevTools/runner em PR #6.  
**Mitigação:** corrigir o runner ou adotar harness equivalente mantendo cobertura determinística; Robo Test não substitui completamente fluxo Maestro.

### R3 — migração Cloudflare não reconciliada no repo

**Impacto:** médio.  
**Evidência:** `vercel.json` e documentação Vercel ainda existem na branch de integração.  
**Mitigação:** remover legado, versionar `_headers`, validar Pages Preview real.

### R4 — Auth real ainda precisa prova fim-a-fim

**Impacto:** alto.  
**Mitigação:** executar cadastro/confirmação/recovery/logout com callbacks reais.

### R5 — dependência do plano Free

**Impacto:** baixo/médio durante MVP.  
**Mitigação:** monitorar cotas, não habilitar cobrança, degradar/aguardar renovação de cota se necessário.

---

## 18. Critério de Release Candidate

`agent/fullstack-mvp` só poderá ser candidato à promoção quando houver evidência para:

- [ ] Cloudflare Pages preview atual e funcional;
- [ ] headers COOP/COEP necessários ao SQLite web;
- [ ] Auth real de confirmação e recuperação;
- [ ] dispositivo físico: notificações;
- [ ] dispositivo físico: PDF/share;
- [ ] offline/reconnect/sync real;
- [ ] E2E automatizado determinístico ou decisão formal de equivalência;
- [ ] Firebase Test Lab primeira matriz PASS;
- [ ] PR #8 reconciliado/mergeado quando aplicável;
- [ ] PR #6 corrigido/mergeado ou formalmente encerrado por ADR;
- [ ] scans de segurança/dependências sem bloqueio;
- [ ] documentação final sincronizada com Agenor/Notion/Miro;
- [ ] sem alteração indevida do escopo clínico.

---

## 19. Métricas para piloto

Sem coletar dados desnecessários, avaliar:

- ativação: usuário registra primeira medição;
- retenção D7/D30;
- registros por usuário ativo;
- taxa de conclusão de lembretes;
- geração de relatório mensal;
- compartilhamento de PDF;
- sucesso de sync após período offline;
- falhas/crashes;
- solicitações de exclusão/exportação;
- suporte por usuário;
- conversão Free → Pro apenas após existência real de plano pago.

Métricas não devem expor conteúdo clínico em analytics de terceiros sem base legal, necessidade e desenho de privacidade.

---

## 20. Governança e papéis

### Proprietário/decisor

Rodrigo / Tupiniquim Tech.

### GitHub

Fonte de verdade técnica e de evidências.

### Agenor / Notion

Controle operacional numerado, prioridades, status e próximos passos.

### Miro

Visualização de waves, fluxo, bloqueios e dependências.

### Regra de sincronização

GitHub/evidência → Notion numerado → Miro visual.

Se um destino falhar, a atualização deve ser marcada como pendente; nunca simular sincronização.

---

## 21. Documentos canônicos

| Documento | Função |
|---|---|
| `PROJECT_BIBLE.md` | visão mestre |
| `PROMPT_PROJECT_MANAGER_10Y.md` | protocolo de continuidade/auditoria |
| `docs/project-bible/ROADMAP_WAVES.md` | waves e tasks |
| `docs/project-bible/COMMERCIAL_PRICING.md` | valuation/preços/monetização |
| `docs/project-bible/RISK_GOVERNANCE.md` | riscos/LGPD/decisões |
| `docs/project-bible/OPERATIONS_RELEASE.md` | ambientes/deploy/release/runbook |
| `docs/project-bible/AGENOR_HANDOFF.md` | pacote de sincronização |
| `docs/project-bible/SOURCE_OF_TRUTH.md` | IDs, refs e evidências |
| `docs/planning/*` | planejamento detalhado Fase 0 preservado |
| `docs/ARCHITECTURE.md` | arquitetura técnica especializada |
| `docs/SECURITY_PRIVACY.md` | baseline de segurança e privacidade |
| `docs/SUPABASE_LIVE.md` | Supabase real |
| `docs/QUALITY_GATES.md` | gates técnicos |

---

## 22. Próximo passo inequívoco

A prioridade operacional atual é:

1. reconciliar o repositório pós-migração Cloudflare;
2. concluir setup externo gratuito do Firebase `teste-d2d1d` e executar primeira matriz;
3. resolver/decidir PR #6 Maestro;
4. executar gates em dispositivo Android físico;
5. validar Auth real;
6. fechar release checklist;
7. somente então propor promoção `agent/fullstack-mvp → main`.

A promoção para `main` não é autorizada apenas porque o MVP compila.
