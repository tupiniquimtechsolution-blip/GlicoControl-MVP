# Arquitetura Alvo — GlicoControl MVP

## Cliente mobile

Expo + React Native + TypeScript.

Camadas sugeridas:

- `app/` ou `src/screens/`: navegação/telas.
- `src/components/`: componentes reutilizáveis.
- `src/features/`: glucose, reminders, medications, reports, profile.
- `src/services/`: Supabase, notificações, PDF, storage/offline.
- `src/domain/`: tipos, validações e regras puras.
- `src/theme/`: tokens e temas.

## Backend

Supabase:

- Auth.
- Postgres.
- RLS.
- migrations versionadas.

Dados primários nunca devem depender do PDF. O PDF é uma projeção dos registros.

## Offline

Objetivo mínimo:

- registrar medição sem internet;
- consultar registros recentes;
- receber notificações locais;
- sincronizar ao voltar a conexão.

A estratégia concreta de persistência offline deve ser definida na Fase 0 e testada contra conflitos/duplicações.

## Notificações

Local-first para lembretes configurados pelo paciente.

Tipos:

- medição;
- medicação.

A notificação não confirma automaticamente que a ação ocorreu.

## PDF

Gerar HTML estruturado e converter localmente para PDF quando viável. O relatório deve mostrar dados reais do mês e indicar dias sem registros.

## Observabilidade

Registrar falhas técnicas sem incluir conteúdo clínico desnecessário.
