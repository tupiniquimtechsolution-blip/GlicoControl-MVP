# FASE 0 — Riscos e Mitigações

Cobre o item 9 do gate. Probabilidade/impacto em escala baixa/média/alta. Riscos novos devem ser
adicionados por PR (este arquivo é vivo).

## Técnicos

| ID | Risco | P | I | Mitigação |
| --- | --- | --- | --- | --- |
| R-TEC-1 | Sandbox sem Docker/emulador/device: E2E completo, build nativo, notificações reais e PDF em device não executáveis aqui | alta | média | Matriz [S]/[E] no backlog; tudo que é [S] roda com evidência; pendências [E] explícitas no checkpoint de cada fase e no RELEASE-CHECKLIST (Fase 10) — **nunca declarado PASS sem execução** |
| R-TEC-2 | Sem projeto Supabase provisionado na sandbox (credencial = decisão humana) | alta | alta | Fase 2 usa Postgres local via apt com migrations idênticas + stub `auth.uid()`; validação contra o serviço real agendada como gate pré-release com aprovação humana de custo |
| R-TEC-3 | Expo SDK novo (57) com incompatibilidade de libs (router/datetimepicker/svg) | média | média | `npx expo install` para pinning do SDK; template default do `create-expo-app@4.0.0` como base; smoke test de boot na Fase 1 |
| R-TEC-4 | TypeScript global 7.x recém-lançado incompatível com tooling Expo/jest | média | baixa | Manter TS 5.9.x do template; atualização só na Fase 10 com verificação |
| R-TEC-5 | Sync LWW perde "melhor esforço" em edição concorrente real de dois dispositivos do mesmo usuário | baixa | baixa | Aceite documentado (paciente solo, 1 device típico); `row_version` + pull pós-conflito preserva a linha vencedora; tombstones evitam zombie-rows |
| R-OFF-3 | Reinstalação do app apaga outbox não sincronizado (perda offline-nunca-enviada) | baixa | alta | Avisar no onboarding e em `docs`; possível mitigação futura: backup local do SQLite via sharing manual; registrado como fora do MVP |
| R-TEC-6 | Datas/timezone (viradas, DST, meia-noite) corromper calendário/relatório | média | alta | Modelo guarda `local_date`/`local_time`/`tz_name` **e** `measured_at`; suíte dedicada na Fase 4 (§21); property tests de calendário |

## Segurança

| ID | Risco | P | I | Mitigação |
| --- | --- | --- | --- | --- |
| R-SEC-1 | Service-role ou key sensível vazar no bundle/CI | baixa | crítica | Somente `EXPO_PUBLIC_*`; secret scan (gitleaks) no CI desde a Fase 1; revisão manual em todo PR de infra |
| R-SEC-2 | Policy RLS ausente/esquecida em tabela nova | média | crítica | `supabase/tests` exige cobertura de TODAS as tabelas do schema (assert por `information_schema`), não lista manual; gate de diff "migrations SEM testes?" |
| R-SEC-3 | Dados clínicos em logs/observabilidade | média | alta | Logger único sanitizado (allowlist); grep-gate em CI por `console.` fora do logger; revisão na Fase 9 |
| R-SEC-4 | Espelho SQLite em aparelho sem bloqueio de tela | média | alta | Documentado no consentimento/privacidade; mitigação padrão de OS; sem criptografia extra no MVP (decisão registrada; revisar na Fase 9) |
| R-SEC-5 | Rate limiting insuficiente em auth/recuperação | média | média | Depende do plano Supabase; sem endpoints próprios; documentado como limitação aceita + teste de UX anti-abuso de duplo-submit no cliente |

## Privacidade / LGPD / Regulatório

| ID | Risco | P | I | Mitigação |
| --- | --- | --- | --- | --- |
| R-LGP-1 | Dados de saúde tratados sem base legal/consentimento documentado | média | crítica | Consentimento explícito no signup (`consent_at`+`consent_version`); versão do texto versionada no repo; sem uso para publicidade/treino de IA (proibição registrada) |
| R-LGP-2 | Direito de acesso/eliminação não atendido | média | alta | Exportação JSON completa + exclusão de conta com cascade físico (Fase 9); fluxo testado |
| R-LGP-3 | Compartilhamento não-intencional de relatório | baixa | alta | PDF gerado só sob demanda; share só por ação explícita; nenhum webhook/e-mail automático — teste de comportamento na Fase 7 |
| R-LGP-4 | Enquadramento regulatório (app de saúde) na distribuição pública | média | alta | Produto declarado ferramenta de registro/organização/relatório; análise jurídica humana ANTES de publicar (gate externo, §30 do prompt mestre) — decisão não é do agente |
| R-LGP-5 | Retenção indefinida de tombstones/logs | baixa | média | Políticas: tombstone 30d; logs de adesão = histórico clínico do usuário (retenção até exclusão); documentado em `docs/PRIVACY.md` (Fase 9) |

## Acessibilidade / UX

| ID | Risco | P | I | Mitigação |
| --- | --- | --- | --- | --- |
| R-A11Y-1 | Estado comunicado só por cor (verde/vermelho) | média | alta | Regra AGENTS + teste lint/RTL (`no-color-only`); componentes já especificados com ícone+texto |
| R-A11Y-2 | Fonte ampliada quebra layout (calendário, tabela PDF) | média | média | Teste RTL com escala máx; regras de truncamento/quebra; scroll vertical permitido |
| R-A11Y-3 | Tokens de tema bons hoje, degradam com componentes novos (cor em background sem par de texto definido) | média | média | Baseline medido PASS (audit script); teste de contraste POR COMPONENTE na Fase 1 com pares `secondary/accent` definidos no design system |
| R-UX-1 | Fluxo de registro passa de 5s com edge cases (confirmações, diálogos) | média | média | Confirmações só para destruição/valor implausível; E2E de tarefas cronometrado na Fase 3 |

## Clínicos (limites)

| ID | Risco | P | I | Mitigação |
| --- | --- | --- | --- | --- |
| R-CLI-1 | Feature evoluir para conselho clínico (ex.: "considere aplicar insulina") | baixa | crítica | Vocabulário fechado em textos (testes de conteúdo: regex de termos proibidos — dose, aplicar, suspensa, prescri, internar); revisão de PR com check "mudou escopo clínico?"; metas são bandas do usuário |
| R-CLI-2 | Usuário interpretar relatório como laudo | média | alta | Rodapé padrão do PDF "gerado pelo paciente, não constitui avaliação médica" (já no fluxo §12) + onboarding com o mesmo aviso |
| R-CLI-3 | Notificação induzir registro automático de medicação | baixa | crítica | Arquitetura: logs só por toque (teste dedicado 6.5); texto na UI "Ações refletem o que você registrou" |

## Revisitas obrigatórias

- Ao fim de cada fase: reavaliar matriz de riscos com o que mudou (PR toca este arquivo quando houver risco novo ou mitigado).
- Antes de QUALQUER publicação: R-TEC-2 (Supabase real), R-LGP-4 (jurídico), builds/E2E [E].
