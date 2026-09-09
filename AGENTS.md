# GlicoControl MVP — Contrato de Agentes

Este arquivo é a autoridade operacional do repositório.

## Antes de agir

1. Leia `README.md`.
2. Leia todos os arquivos relevantes em `docs/`.
3. Leia `.agents/skills/tupiniquim-toolbox/SKILL.md`.
4. Inspecione o estado real do repositório antes de editar.
5. Não invente funcionalidades, testes, infraestrutura ou resultados.

## Missão

Construir um MVP mobile-first para registro de glicemia, calendário, lembretes e relatório mensal em PDF para acompanhamento médico.

## Regras clínicas invariantes

- O app NÃO diagnostica.
- O app NÃO prescreve.
- O app NÃO recomenda ou altera doses.
- O app NÃO calcula dose de insulina automaticamente.
- O app NÃO substitui orientação médica.
- Alertas clínicos, caso existam, devem ser informativos e configuráveis, sem instrução terapêutica automática.

## Segurança e privacidade

- Dados de saúde são sensíveis.
- Nunca versionar `.env`, tokens, chaves privadas, service-role keys ou secrets.
- Toda autorização de dados deve ser validada no backend/banco.
- RLS deve impedir acesso horizontal entre pacientes.
- Minimizar dados coletados e logs.
- Nunca registrar valores glicêmicos em logs de observabilidade sem necessidade explícita e justificada.
- Compartilhamento de relatório somente por ação explícita do paciente.
- Mudanças destrutivas de schema/dados reais exigem aprovação.

## UX/UI

- Mobile-first e acessível.
- Registro de glicemia deve exigir o mínimo de passos possível.
- Não depender apenas de cor para comunicar estado.
- Suportar fonte ampliada e leitores de tela.
- Usar os temas definidos em `src/theme/themes.ts`.
- UI UX Pro Max é a referência principal de design system/QA visual.
- Motion deve ser discreto; Emil Skills apenas quando necessário.
- Taste Skill não é baseline para este app por ser dashboard/data-heavy.

## Stack alvo

- Expo + React Native + TypeScript.
- Supabase/Postgres/Auth/RLS.
- Notificações locais.
- PDF gerado preferencialmente no dispositivo a partir de dados estruturados.

## Qualidade

Antes de declarar uma fase concluída:

- lint;
- typecheck;
- testes unitários;
- testes de integração;
- testes E2E do fluxo crítico;
- testes de segurança/RLS;
- build validado;
- revisão do diff;
- documentação atualizada.

Falha crítica/alta de segurança bloqueia release até correção ou aceite de risco documentado.

## Fluxo de trabalho

PLANEJAR → IMPLEMENTAR → TESTAR → CORRIGIR → REVISAR DIFF → DOCUMENTAR → CHECKPOINT.

Não pule fases sem justificativa documentada.
