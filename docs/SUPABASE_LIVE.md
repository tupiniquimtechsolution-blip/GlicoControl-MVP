# Supabase gerenciado — ambiente do MVP

## Projeto

- Nome: `GlicoControl-MVP`
- Project ref: `bvyhtoimcprhfmbyrsoi`
- Região: `sa-east-1` (São Paulo)
- Plano: Free
- API URL: `https://bvyhtoimcprhfmbyrsoi.supabase.co`

## Configuração do app

O app usa somente credenciais públicas de cliente:

```env
EXPO_PUBLIC_SUPABASE_URL=https://bvyhtoimcprhfmbyrsoi.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<definir fora do repositório>
```

Nunca colocar `service_role`, secret key, senha de banco ou qualquer chave administrativa no app, no Git ou em logs.

## Estado validado em 2026-09-10

- migrations `0001`–`0015` aplicadas no projeto gerenciado;
- 7 tabelas de dados do paciente com RLS habilitada;
- `anon` sem `EXECUTE` nas RPCs do app;
- `authenticated` restrito às RPCs esperadas;
- teste A×B real no Postgres gerenciado: leitura/update/delete/insert forjado bloqueados por RLS;
- teste real da RPC `sync_upsert_row`: `applied`, `skipped-stale` e `parent-missing` confirmados;
- dados e usuários sintéticos foram executados dentro de transação e removidos por rollback;
- Security Advisor: apenas avisos intencionais das 3 RPCs `SECURITY DEFINER` autenticadas;
- Performance Advisor: apenas índices ainda sem uso em banco recém-provisionado.

## Regra de custo

Este projeto deve permanecer em recursos gratuitos. Não habilitar plano Pro, compute pago, PITR, branching pago, add-ons ou serviços cobrados sem nova autorização explícita.

## Gates ainda externos

1. executar cadastro/login pelo app contra Supabase Auth;
2. validar sincronização no cliente real;
3. executar build Android gratuito/local;
4. validar notificações e PDF em dispositivo físico;
5. executar fluxo Maestro em dispositivo;
6. somente depois considerar promoção de `agent/fullstack-mvp` para `main`.
