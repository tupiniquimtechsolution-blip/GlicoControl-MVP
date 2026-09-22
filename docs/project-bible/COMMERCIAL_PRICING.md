# Modelo Comercial, Precificação e Valor de Reposição

**Projeto:** GlicoControl-MVP  
**Data-base dos benchmarks:** 2026-09-22  
**Moeda de referência:** BRL  
**Câmbio de referência da auditoria:** 1 USD ≈ R$ 5,12

> Este documento é um **modelo de precificação e benchmark comercial**, não um laudo contábil, valuation oficial, recomendação de investimento ou parecer jurídico.

---

## 1. Quatro números que não devem ser confundidos

### 1. Custo de reposição

Quanto uma empresa teria de investir hoje para reconstruir um produto equivalente, com arquitetura, mobile, backend, offline, segurança, testes, documentação e gestão.

### 2. Preço de venda do projeto/IP

Quanto pode ser negociado pela entrega do código, documentação, direitos, exclusividade e suporte.

### 3. Preço do produto para cliente final

Assinatura ou licença cobrada de usuários/clientes depois que o produto for validado comercialmente.

### 4. Custo operacional

Quanto custa manter infraestrutura, suporte, observabilidade, domínio, lojas etc. No estágio atual do GlicoControl a política do proprietário exige **R$ 0 de custo de plataforma**, salvo decisão explícita posterior.

---

# 2. Benchmarks externos — setembro/2026

## Desenvolvimento React Native

Upwork publica faixa típica de **US$24–45/h** para React Native.

Fonte:

- https://www.upwork.com/hire/react-native-developers/cost/
- https://www.upwork.com/resources/cost-build-mobile-app

A própria Upwork destaca que um app completo exige, além do developer, PM, design, QA e backend.

## Empresa de desenvolvimento mobile

O Pricing Guide 2026 da Clutch informa:

- projetos de app revisados normalmente entre **US$10.000–49.999**;
- empresas de app geralmente entre **US$25–49/h**;
- Android e cross-platform também aparecem na faixa **US$25–49/h**.

Fonte:

- https://clutch.co/directory/mobile-application-developers/pricing

## Software sob medida

A Clutch publica para custom software:

- faixa comum de **US$10.000–49.999** por projeto;
- **US$24–49/h** como faixa recorrente de empresas;
- média reportada entre reviews de aproximadamente US$132 mil, mostrando que soluções mais amplas podem superar bastante a faixa modal.

Fonte:

- https://clutch.co/developers/pricing

## UX

Clutch indica UX agencies predominantemente em **US$25–49/h**, com projetos UX frequentemente acima de US$10 mil.

Fonte:

- https://clutch.co/agencies/ui-ux/pricing

## QA, PM e especialidades

Referência Upwork 2026:

- Product Manager: **US$25–45/h**;
- QA Engineer: **US$20–60/h**;
- React Native: **US$24–45/h**;
- Penetration Tester: **US$60–120/h**.

Fonte:

- https://www.upwork.com/resources/upwork-hourly-rates/

---

# 3. Conversão indicativa para BRL

Com USD/BRL de referência ≈ **5,12**:

| USD/h | BRL/h aproximado |
|---:|---:|
| US$ 24 | R$ 122,88 |
| US$ 25 | R$ 128,00 |
| US$ 45 | R$ 230,40 |
| US$ 49 | R$ 250,88 |
| US$ 60 | R$ 307,20 |
| US$ 120 | R$ 614,40 |

Isso não significa que toda hora do projeto deve ser faturada na mesma tarifa; equipes misturam senioridades e especialidades.

---

# 4. Estimativa de esforço equivalente do ativo GlicoControl

Abaixo está uma reconstrução aproximada do esforço necessário para entregar produto equivalente **do zero**, com disciplina profissional e documentação.

| Macroentrega | Horas equivalentes estimadas |
|---|---:|
| Discovery, produto, escopo e gestão | 80–130 h |
| UX/UI, temas, acessibilidade e design system | 90–150 h |
| Mobile core, navegação, formulários, calendário/histórico | 220–320 h |
| Supabase, Auth, banco, migrations, RLS, LGPD | 160–240 h |
| SQLite offline + sync/conflitos | 100–160 h |
| Lembretes, medicamentos, PDF e integrações nativas | 100–160 h |
| QA, CI, segurança, Android, E2E e hardening | 140–220 h |
| Deploy, documentação, handoff e release | 60–100 h |
| **Total estimado** | **950–1.480 h** |

### Interpretação

Aplicando faixas de mercado de aproximadamente R$128–R$230/h ao envelope de horas, a ordem de grandeza fica em:

- piso técnico aproximado: 950 × R$128 = **R$121.600**;
- teto técnico aproximado: 1.480 × R$230,40 = **R$340.992**.

## Faixa de reposição recomendada para documentação

**R$120 mil – R$340 mil**.

Essa faixa deve ser entendida como **custo de reposição equivalente**, não como preço automático de venda.

---

# 5. Faixa comercial do ativo/projeto

## Licença não exclusiva / implantação baseada no produto

Quando o código-base continua pertencendo à Tupiniquim Tech e o cliente recebe uma implantação/licença:

**R$60 mil – R$120 mil** como faixa de projeto inicial de referência.

Pode incluir, conforme contrato:

- adaptação de marca;
- configuração;
- implantação;
- treinamento/documentação;
- suporte inicial;
- sem cessão exclusiva de IP.

## Cessão exclusiva de IP / source code + documentação

Quando o comprador deseja direito exclusivo, código, arquitetura, migrations, testes e documentação:

**R$150 mil – R$300 mil** como faixa de negociação de referência.

Projetos com garantias, SLA, migração, suporte prolongado, compliance adicional e exclusividade ampla podem justificar valores maiores.

## White-label futuro

O GlicoControl **ainda não é um produto white-label/multitenant pronto**. Se essa evolução for aprovada no futuro, hipótese comercial inicial:

- setup por cliente: **R$15 mil – R$40 mil**;
- recorrência de plataforma/suporte: **R$1 mil – R$3 mil/mês**;
- customizações fora do pacote: projeto separado.

Essas faixas são hipóteses e só devem virar tabela oficial depois de arquitetura multi-tenant, operação, SLA e suporte estarem definidos.

---

# 6. Hipótese de monetização B2C

## Comparável de contexto

Glucose Buddy atualmente apresenta planos a partir de **US$19,99/mês**, com opções de US$29,99 e US$59,99. Porém esses pacotes podem incluir coaching, medidor, lancetas e tiras; portanto **não são comparáveis diretamente** ao GlicoControl atual.

Fonte:

- https://www.glucosebuddy.com/plans

O GlicoControl é hoje um produto de registro/organização/offline/report, sem coaching, hardware ou prescrição. Logo, competir pelo mesmo preço sem entregar a mesma cesta de valor seria inadequado.

## Faixa de teste recomendada

### Free

Manter funções essenciais de segurança e utilidade:

- registro básico;
- histórico essencial;
- privacidade/exportação;
- funcionalidades mínimas necessárias para o produto ser útil.

### Pro — hipótese para teste

**R$14,90–R$24,90/mês**.

Possíveis benefícios futuros não clínicos:

- relatórios avançados;
- histórico ampliado;
- personalização;
- exportações/organização premium;
- automações convenientes;
- recursos familiares quando a arquitetura permitir.

### Anual — hipótese

**R$149–R$199/ano**.

Esses preços só devem ser definidos após pesquisa de disposição a pagar e piloto.

---

# 7. B2B futuro — clínicas/empresas

Não existe portal clínico no MVP atual. Qualquer produto B2B exigiria nova wave de escopo, contrato e proteção de dados.

Hipótese futura, após multi-tenant e governança:

| Oferta futura | Faixa exploratória |
|---|---:|
| Implantação pequena organização | R$5 mil–R$20 mil |
| SaaS pequeno B2B | R$299–R$999/mês |
| White-label setup | R$15 mil–R$40 mil |
| White-label recorrente | R$1 mil–R$3 mil/mês |

Não apresentar essas ofertas como disponíveis hoje.

---

# 8. Suporte e manutenção vendáveis

Uma prática comum em projetos sob medida é separar construção de manutenção.

Faixa exploratória para Tupiniquim Tech:

- suporte leve/evolutivo: **R$1,5 mil–R$3 mil/mês**;
- operação/SLA mais amplo: **R$3 mil–R$5 mil+/mês**;
- ou orçamento anual equivalente a aproximadamente **8–15% do valor de construção**, dependendo de SLA, volume e responsabilidade.

A precificação final deve incluir limites de horas, tempo de resposta e itens excluídos.

---

# 9. O que valoriza o GlicoControl

- código próprio e versionado;
- arquitetura offline-first;
- sincronização real;
- Supabase RLS comprovado;
- Auth PKCE;
- LGPD desde a arquitetura;
- CI e quality gates;
- Android nativo comprovado;
- APK standalone;
- documentação Fase 0 + Bíblia;
- cinco temas;
- PDF/share;
- pipeline de validação;
- separação explícita de escopo clínico.

# 10. O que reduz o valuation hoje

- ainda sem produção consolidada em `main`;
- E2E Maestro bloqueado;
- validação física ainda não encerrada;
- primeira matriz Test Lab pendente;
- Cloudflare ainda precisa reconciliação documental/operacional;
- sem cohort/piloto e métricas de retenção;
- sem receita comprovada;
- sem publicação em loja;
- sem multi-tenancy/white-label;
- sem certificação/regulatory assessment formal quando aplicável.

---

# 11. Modelo de proposta comercial futura

Uma proposta profissional deve separar:

1. **licença/IP**;
2. **implantação/configuração**;
3. **customizações**;
4. **migração/importação de dados**, se existir;
5. **treinamento**;
6. **suporte/SLA**;
7. **infraestrutura**;
8. **serviços de terceiros**;
9. **manutenção evolutiva**;
10. **escopo regulatório/compliance adicional**.

Evitar vender “app completo” por um preço único sem delimitar responsabilidades.

---

# 12. Política de desconto

Recomendação para futuras negociações:

- desconto deve reduzir escopo, prazo de suporte ou exclusividade antes de reduzir drasticamente a taxa;
- cessão exclusiva de código/IP deve custar mais que licença não exclusiva;
- white-label reutilizável não deve transferir o core para um único cliente;
- PoC/piloto comercial deve ter escopo e duração definidos;
- evitar lifetime deal enquanto custo de suporte/LTV não for conhecido.

---

# 13. Custos operacionais do proprietário — política atual

**Meta atual: R$0.**

| Componente | Estratégia atual |
|---|---|
| GitHub | repo público + recursos incluídos |
| Cloudflare Pages | Free |
| Supabase | Free |
| Firebase | Spark / Test Lab dentro da cota gratuita |
| Android builds | GitHub standard runners aplicáveis |
| Development Client | GitHub Actions/local, sem EAS pago |
| Observabilidade paga | não ativada |
| Loja paga | bloqueada sem autorização |

Quando um limite gratuito for atingido, a ação padrão é **aguardar/replanejar**, não ativar billing automaticamente.

---

# 14. Nível de confiança das faixas

| Faixa | Confiança | Motivo |
|---|---|---|
| Tarifas horárias externas | Alta | fontes de mercado atuais |
| Custo de reposição | Média/Alta | horas estimadas × benchmarks; depende da equipe |
| Venda não exclusiva | Média | estratégia comercial, depende do comprador |
| Cessão exclusiva | Média | direitos e suporte mudam bastante o valor |
| B2C mensal | Baixa/Média | precisa pesquisa real de disposição a pagar |
| B2B/white-label | Baixa | produto ainda não está arquitetado para essa oferta |

---

# 15. Regra de atualização

Revisar este documento quando ocorrer um dos eventos:

- piloto com usuários;
- primeira receita;
- mudança relevante de escopo;
- multi-tenancy;
- publicação em loja;
- requisito regulatório novo;
- mudança estrutural de infraestrutura;
- variação de câmbio relevante para proposta em USD;
- negociação real com cliente/investidor.
