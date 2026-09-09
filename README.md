# GlicoControl MVP

Aplicativo mobile-first para registro e acompanhamento de medições de glicemia, lembretes configuráveis de medições/medicações e geração de relatório mensal em PDF para apresentação ao profissional de saúde.

## Estado

**BOOTSTRAP / PRÉ-DESENVOLVIMENTO**

Este repositório foi preparado para receber a implementação full stack. O agente de desenvolvimento deve ler `AGENTS.md` e a documentação em `docs/` antes de alterar código.

## Escopo do MVP

- Cadastro/autenticação do paciente.
- Registro de glicemia com data, hora, unidade e contexto da medição.
- Histórico e calendário mensal.
- Lembretes locais de medição.
- Cadastro e lembretes de medicamentos já prescritos ao paciente.
- Registro de adesão (`tomado`, `adiado`, `ignorado`).
- Relatório mensal em PDF com resumo, tabela completa e gráficos.
- Compartilhamento explícito do PDF pelo paciente.
- Temas acessíveis e selecionáveis.
- Segurança, privacidade e LGPD como requisitos de arquitetura.

## Limites clínicos

O produto organiza dados e lembretes. Não diagnostica, prescreve, calcula doses, altera tratamento ou substitui avaliação médica.

## Stack alvo

- Expo + React Native + TypeScript.
- Supabase: Postgres, Auth e Row Level Security.
- `expo-notifications` para lembretes locais.
- `expo-print` + `expo-sharing` para PDF/compartilhamento.
- Persistência/offline com estratégia a ser validada na Fase 0.

## Temas previstos

1. Pastel Calm.
2. Verde / Branco.
3. Amarelo / Branco.
4. Preto / Branco.
5. Preto / Amarelo.

Os tokens iniciais estão em `src/theme/themes.ts`.

## Documentos

- `AGENTS.md` — contrato operacional do projeto.
- `docs/PRODUCT_SCOPE.md` — escopo e critérios funcionais.
- `docs/ARCHITECTURE.md` — arquitetura alvo.
- `docs/SECURITY_PRIVACY.md` — baseline de segurança e privacidade.
- `docs/THEME_SYSTEM.md` — sistema visual e acessibilidade.
- `docs/TOOLBOX_DECISIONS.md` — decisões resultantes do Tupiniquim Toolbox.
- `docs/QUALITY_GATES.md` — gates obrigatórios antes de release.
- `PROMPT_AGENT_FULLSTACK.md` — prompt autocontido de continuidade/desenvolvimento.
