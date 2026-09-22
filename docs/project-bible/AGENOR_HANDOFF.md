# HANDOFF PARA AGENOR — GlicoControl-MVP

**Data-base:** 2026-09-22  
**Projeto:** GlicoControl-MVP  
**ID Notion:** PRJ-3  
**Fonte técnica:** `tupiniquimtechsolution-blip/GlicoControl-MVP`

---

# 1. Reconciliação do projeto

## Estado anterior no Notion

```text
Status: Pausado
Nota: INACTIVE
```

## Estado real auditado

```text
Status correto: Ativo
Prioridade: Alta
Área: Produto
```

Motivo:

- houve implementação completa do MVP;
- Supabase real foi provisionado/testado;
- Android gates foram executados;
- Auth PKCE foi integrado;
- Development Build/APK standalone existem;
- Cloudflare e Firebase são waves ativas.

O estado `Pausado/INACTIVE` é obsoleto.

---

# 2. AGENOR_UPDATE — tasks canônicas

Abaixo estão os itens que devem existir na agenda numerada. A mesma `Sequência` deve ser reutilizada em futuras atualizações.

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W0
Sequência: 10
Etapa: Governança / Fase 0
Task: Auditar e planejar MVP, arquitetura, dados, RLS, UX, riscos e backlog
Status: Concluída
Prioridade: Alta
Evidência: Issue #1 + docs/planning/PHASE0-*
Dependências: nenhuma
Próximo passo: manter como histórico canônico
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W1
Sequência: 20
Etapa: Implementação
Task: Entregar MVP full-stack funcional
Status: Concluída
Prioridade: Alta
Evidência: PR #2 / fluxos mobile + backend
Dependências: W0
Próximo passo: manter como baseline
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W2
Sequência: 30
Etapa: Hardening
Task: Fechar CI, segurança, LGPD, RPC grants e qualidade
Status: Concluída
Prioridade: Alta
Evidência: PR #2 hardening + migration 0014
Dependências: W1
Próximo passo: monitorar regressões
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W3
Sequência: 40
Etapa: Supabase real
Task: Aplicar migrations, RLS real A×B, advisors e sync RPC
Status: Concluída
Prioridade: Crítica
Evidência: Supabase bvyhtoimcprhfmbyrsoi + migration 0015 + PR #3
Dependências: W2
Próximo passo: revalidar em mudanças de schema/policy
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W4
Sequência: 50
Etapa: Auth e privacidade
Task: Implementar PKCE, callbacks separados e wipe local
Status: Concluída
Prioridade: Crítica
Evidência: PR #5
Dependências: W3
Próximo passo: executar validação Auth real (Sequência 55)
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W4
Sequência: 55
Etapa: Auth real
Task: Validar allowlist, signup, confirmação, recovery, logout e troca de usuário
Status: A Fazer
Prioridade: Crítica
Evidência: implementação pronta; validação externa ainda sem prova final
Dependências: URLs Supabase + dispositivo/cliente real
Próximo passo: executar roteiro end-to-end e registrar evidências
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W5
Sequência: 60
Etapa: Android builds
Task: Native Gate, Development Build e Standalone APK
Status: Concluída
Prioridade: Alta
Evidência: Android Native Gate + job 103545470381 + artifact standalone
Dependências: W2/W4
Próximo passo: usar artifacts nos gates de W6/W8
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W6
Sequência: 70
Etapa: E2E automatizado
Task: Corrigir/decidir Maestro Emulator Gate do PR #6
Status: Bloqueada
Prioridade: Crítica
Evidência: PR #6 aberto; falha Metro/React Native DevTools/runner
Dependências: decisão técnica sobre harness
Próximo passo: corrigir runner ou criar ADR de substituição com cobertura equivalente
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W6
Sequência: 75
Etapa: Dispositivo físico
Task: Testar notificações, PDF/share, offline/reconnect, temas e multi-account
Status: A Fazer
Prioridade: Crítica
Evidência: builds instaláveis já disponíveis
Dependências: aparelho Android + Auth real
Próximo passo: executar checklist físico
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W7
Sequência: 80
Etapa: Cloudflare
Task: Reconciliar deploy Pages pós-migração e remover legado Vercel
Status: Em Andamento
Prioridade: Alta
Evidência: migração Cloudflare informada; vercel.json/docs ainda no repo
Dependências: acesso/configuração Cloudflare
Próximo passo: versionar _headers, validar build dist e URL pages.dev
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W8
Sequência: 90
Etapa: Firebase Test Lab
Task: Configurar APIs, WIF e Repository Variables para teste-d2d1d
Status: Aguardando
Prioridade: Alta
Evidência: PR #8 + projeto Firebase existente + APK standalone PASS
Dependências: Google Cloud externo
Próximo passo: habilitar APIs e WIF sem billing
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W8
Sequência: 95
Etapa: Firebase Test Lab
Task: Executar primeira Robo matrix e registrar resultado
Status: A Fazer
Prioridade: Alta
Evidência: workflow pronto no PR #8
Dependências: Sequência 90
Próximo passo: workflow_dispatch com um dispositivo virtual
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W9
Sequência: 100
Etapa: Release Candidate
Task: Fechar PRs #6/#8 e executar gates finais no mesmo HEAD
Status: Bloqueada
Prioridade: Crítica
Evidência: W4/W6/W7/W8 ainda abertos
Dependências: Sequências 55, 70, 75, 80, 90, 95
Próximo passo: somente após caminho crítico verde
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W9
Sequência: 110
Etapa: Produção
Task: Abrir PR agent/fullstack-mvp → main e promover release validado
Status: Bloqueada
Prioridade: Crítica
Evidência: main ainda não promovida
Dependências: Sequência 100
Próximo passo: não executar antecipadamente
```

```text
AGENOR_UPDATE
Projeto: GlicoControl-MVP
Wave: W10
Sequência: 120
Etapa: Piloto e comercial
Task: Definir piloto, métricas, disposição a pagar e modelo B2C/B2B
Status: A Fazer
Prioridade: Média
Evidência: pricing benchmark documentado; sem usuários/receita validados
Dependências: release candidate
Próximo passo: iniciar após W9
```

---

# 3. Decisões que Agenor deve preservar

- Cloudflare substitui Vercel como deployment web canônico.
- Supabase permanece Free.
- Firebase `teste-d2d1d` permanece Spark, sem billing.
- nenhuma plataforma pode gerar custo sem autorização explícita;
- `main` continua bloqueada até release gates;
- Maestro e Firebase Robo são complementares até ADR afirmar o contrário;
- nenhum aumento de escopo clínico;
- não armazenar secrets em gestão/documentação.

---

# 4. Próxima wave operacional

A execução imediata deve priorizar em paralelo controlado:

1. Sequência 80 — Cloudflare;
2. Sequência 90 → 95 — Firebase;
3. Sequência 70 — decisão/correção Maestro;
4. Sequência 55 + 75 — Auth real e dispositivo físico.

Após essas quatro linhas convergirem, iniciar Sequência 100.

---

# 5. Pacote Miro sugerido

Criar/atualizar tabela visual `GlicoControl — Waves e Pendências` com colunas:

```text
Seq | Wave | Task | Status | Prioridade | Evidência/Dependência | Próximo passo
```

Cores/agrupamentos devem seguir status do Agenor; Miro não pode divergir do Notion.

---

# 6. Regra de futuros handoffs

Não criar nova tarefa quando apenas o status mudar. Atualizar a tarefa de mesma sequência.

Ao final de cada sessão material, gerar um delta:

```text
CRIADO:
INICIADO:
ATUALIZADO:
BLOQUEADO:
AGUARDANDO:
CONCLUÍDO:
DECISÕES:
DEPENDÊNCIAS:
PRÓXIMO PASSO:
```
