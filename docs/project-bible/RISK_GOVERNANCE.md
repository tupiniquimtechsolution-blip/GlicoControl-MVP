# Riscos, Governança, Segurança e Decisões

**Projeto:** GlicoControl-MVP  
**Data-base:** 2026-09-22

---

# 1. Princípios de governança

1. GitHub é a fonte de verdade técnica.
2. Uma task não é concluída sem evidência adequada.
3. `main` representa promoção controlada; não é área de experimentação.
4. Dados de saúde são tratados como sensíveis.
5. O produto não assume responsabilidade clínica.
6. Nenhum custo de plataforma é autorizado sem decisão explícita.
7. Mudanças arquiteturais relevantes exigem ADR ou registro equivalente.
8. Agenor/Notion mantém estado operacional; Miro espelha a visão visual.
9. Divergência entre GitHub e gestão é uma pendência de sincronização, não uma nova verdade.

---

# 2. Registro de riscos atual

| ID | Risco | Prob. | Impacto | Severidade | Estado | Mitigação |
|---|---|---|---|---|---|---|
| R-01 | Release sem teste físico de notificações/PDF/offline | Alta | Alto | Crítica | Aberto | concluir W6 |
| R-02 | Maestro E2E não fecha no runner | Alta | Médio/Alto | Alta | Bloqueado | corrigir harness ou ADR de substituição equivalente |
| R-03 | Cloudflare migrado externamente, repo ainda contém Vercel | Alta | Médio | Alta | Em tratamento | remover legado e validar Pages |
| R-04 | Auth real/redirect allowlist sem evidência final | Média | Alto | Alta | Aberto | executar signup/confirm/recovery real |
| R-05 | Test Lab preparado mas WIF/APIs pendentes | Alta | Médio | Média/Alta | Aguardando | configuração externa Spark/WIF |
| R-06 | Promoção prematura para `main` | Média | Alto | Alta | Controlado | gate checklist obrigatório |
| R-07 | Vulnerabilidade transitiva moderada Expo/router | Média | Médio | Média | Monitorar | atualizar sem `--force` destrutivo |
| R-08 | Supabase Free pausar/inibir por limite/inatividade | Baixa/Média | Médio | Média | Aceito | monitorar; sem upgrade automático |
| R-09 | Cloudflare/Firebase/Supabase exceder cota gratuita | Baixa/Média | Médio | Média | Controlado | fail closed; aguardar cota em vez de billing |
| R-10 | Escopo clínico crescer sem governança | Média | Muito Alto | Crítica | Controlado | boundary scans + revisão de produto |
| R-11 | Dados sensíveis vazarem em logs/analytics | Baixa/Média | Muito Alto | Crítica | Controlado | minimização, secret scan, revisão de observabilidade |
| R-12 | Offline sync criar perda/duplicação de dados | Média | Alto | Alta | Parcialmente mitigado | RPC semantics + teste físico pendente |
| R-13 | PDF conter informação indevida ou de conta anterior | Baixa/Média | Alto | Alta | Aberto | teste físico multi-account |
| R-14 | Precificação virar promessa sem validação | Média | Médio | Média | Controlado | classificar valores como benchmark/hipótese |

---

# 3. Matriz de decisão de release

## Pode integrar em `agent/fullstack-mvp` quando

- mudança tem escopo delimitado;
- CI aplicável está verde;
- não reduz segurança;
- documentação é atualizada se altera arquitetura/status;
- não introduz custo.

## Pode promover para `main` somente quando

- Auth real validado;
- Cloudflare Pages validado;
- dispositivo físico validado;
- E2E automatizado concluído ou substituído por ADR e cobertura equivalente;
- Test Lab real executado;
- segurança/dependências sem bloqueio high/critical;
- PRs pendentes reconciliados;
- release notes prontas;
- Agenor/Notion/Miro coerentes.

---

# 4. Boundary clínico

## Permitido

- registrar dados informados pelo usuário;
- organizar cronologia;
- lembretes configurados pelo usuário;
- metas previamente configuradas;
- resumos descritivos;
- exportação/relatório;
- confirmação de valores extremos como validação de entrada.

## Não permitido no escopo atual

- diagnosticar;
- classificar doença;
- alterar terapia;
- recomendar dose;
- prescrever/remover medicamento;
- afirmar que um valor exige determinada conduta clínica;
- recomendar insulina;
- substituir profissional de saúde.

Qualquer feature que atravesse essa fronteira exige nova avaliação jurídica/regulatória, produto e segurança.

---

# 5. LGPD — modelo operacional

### Categorias

- identificação mínima de conta;
- dados de perfil necessários;
- medições glicêmicas;
- registros de medicamentos/adesão;
- configurações de lembrete;
- metas informadas/configuradas;
- dados técnicos mínimos de sync.

### Regras

- minimização;
- finalidade explícita;
- RLS;
- exportação;
- exclusão;
- logout com wipe local;
- não usar metadata de Auth como fonte de autorização;
- não armazenar service-role no cliente;
- não usar dados reais em demo/Test Lab;
- analytics de terceiros só após avaliação de necessidade/base legal.

---

# 6. Segurança do Supabase

### Padrões

- tabelas de paciente com RLS;
- políticas baseadas em `(select auth.uid())`;
- grants explícitos;
- RPCs públicas revogadas de anon quando não devem ser acessíveis;
- helpers internos não disponíveis a authenticated;
- `SECURITY DEFINER` apenas quando justificado;
- `search_path` fixado nas funções auditadas;
- migrations append-only.

### Gates já provados

- RLS A×B real;
- anon/auth grants;
- sync RPC;
- account deletion hardening;
- advisors principais resolvidos.

---

# 7. Segurança de Auth

PKCE é padrão obrigatório para callbacks mobile.

Regras:

- nunca enviar access/refresh token diretamente no callback;
- callbacks específicos para confirm/recovery;
- validar host/rota exata;
- sessão só existe após troca de `code` válida;
- limpar estado anterior no logout;
- não confiar em `user_metadata` para autorização.

---

# 8. Segurança de supply chain

Já aplicado em gates específicos:

- versões relevantes pinadas quando possível;
- checksum Maestro validado;
- emulator-runner pinado por commit;
- npm audit sem correção `--force` automática;
- GitHub Actions standard runners;
- artifacts temporários com retenção curta.

### Débito técnico

Ações GitHub que internamente ainda referenciem runtimes Node antigos devem ser atualizadas quando versões oficiais compatíveis estiverem disponíveis, sem trocar para forks não confiáveis.

---

# 9. Política de secrets

Nunca versionar:

- service-role Supabase;
- credenciais Firebase/GCP;
- chaves privadas;
- tokens pessoais;
- secrets de produção.

Publishable/anon client keys podem ser tecnicamente públicas, mas devem preferencialmente permanecer em env para manutenção e rotação.

WIF é preferido a chave JSON persistente para GitHub → Google Cloud.

---

# 10. Gestão de mudanças

Mudança é considerada arquitetural se alterar:

- identidade/Auth;
- modelo de dados;
- sync;
- RLS;
- offline storage;
- deployment;
- boundary clínico;
- coleta de dados;
- modelo comercial que exija arquitetura nova;
- dependência crítica.

Mudanças arquiteturais devem atualizar:

1. ADR/documentação;
2. Bíblia;
3. roadmap;
4. Agenor;
5. Miro quando operacionalmente relevante.

---

# 11. Decisões arquiteturais vigentes

| Decisão | Estado |
|---|---|
| Expo + React Native + TypeScript | Vigente |
| Supabase/Postgres/Auth/RLS | Vigente |
| SQLite offline-first | Vigente |
| Sync por RPC controlada | Vigente |
| PKCE para Auth mobile | Vigente |
| HTML → expo-print → sharing | Vigente |
| cinco temas semânticos | Vigente |
| Cloudflare Pages para web preview | Vigente — substitui Vercel |
| GitHub Actions para builds gratuitos | Vigente |
| Firebase Spark/Test Lab | Vigente para validação gratuita |
| sem IA clínica no MVP | Vigente |
| custo operacional zero | Vigente |
| `main` protegida por processo de gate | Vigente |

---

# 12. Decisões pendentes

### D-01 — Maestro

**Questão:** corrigir PR #6 ou substituir harness?  
**Regra:** Robo Test não cobre necessariamente o mesmo fluxo determinístico.  
**Saída esperada:** PR verde ou ADR de substituição com cobertura equivalente.

### D-02 — Modelo comercial inicial

**Questão:** B2C, B2B, white-label ou combinação?  
**Dependência:** piloto + pesquisa de disposição a pagar.

### D-03 — Publicação em loja

**Questão:** quando/como distribuir publicamente?  
**Bloqueio atual:** qualquer taxa viola política de custo zero sem nova autorização.

### D-04 — iOS

Não há gate iOS equivalente no escopo atual. Adicionar iOS como requisito de release é nova decisão de produto/plataforma.

---

# 13. Escalonamento

Escalonar imediatamente ao proprietário quando:

- uma correção exigir custo;
- houver risco de perda/vazamento de dados;
- um requisito puder ser clínico/regulatório;
- for necessário quebrar compatibilidade/migration destrutiva;
- release depender de remover um gate sem cobertura equivalente;
- houver solicitação de exclusividade/IP;
- for necessário ampliar escopo além do MVP documentado.
