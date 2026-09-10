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

## Auth mobile / deep link

O scheme nativo canônico é `glicocontrol` e o callback usado para confirmação de cadastro e recuperação de senha é:

```text
glicocontrol://auth-callback
```

No projeto Supabase gerenciado, esse callback precisa constar em **Authentication → URL Configuration → Redirect URLs** antes dos testes reais de e-mail. Preferir o caminho exato acima em produção; não usar wildcard amplo sem necessidade.

O app mantém confirmação de e-mail habilitada: cadastro sem sessão exibe estado “Confirme seu e-mail”, e o callback cria a sessão somente depois que o usuário abre um link válido. O mesmo callback identifica `type=recovery`, permite definir nova senha e encerra a sessão de recovery após a atualização.

`raw_user_meta_data` é usada somente para transportar nome/versão de consentimento durante o cadastro. Ela **não** participa de RLS, autorização ou decisão de acesso. Após uma sessão confirmada, o app inicializa `profiles` sob as políticas RLS do próprio usuário.

## Estado validado em 2026-09-10

- migrations `0001`–`0015` aplicadas no projeto gerenciado;
- 7 tabelas de dados do paciente com RLS habilitada;
- `anon` sem `EXECUTE` nas RPCs do app;
- `authenticated` restrito às RPCs esperadas;
- teste A×B real no Postgres gerenciado: leitura/update/delete/insert forjado bloqueados por RLS;
- teste real da RPC `sync_upsert_row`: `applied`, `skipped-stale` e `parent-missing` confirmados;
- dados e usuários sintéticos foram executados dentro de transação e removidos por rollback;
- Security Advisor: apenas avisos intencionais das 3 RPCs `SECURITY DEFINER` autenticadas;
- Performance Advisor: apenas índices ainda sem uso em banco recém-provisionado;
- build Android nativo (`expo prebuild` + Gradle `assembleDebug`) validado em GitHub Actions com runner padrão gratuito;
- package Android e `appId` Maestro canônicos: `app.tupiniquim.glicocontrol`.

## Regra de custo

Este projeto deve permanecer em recursos gratuitos. Não habilitar plano Pro, compute pago, PITR, branching pago, add-ons ou serviços cobrados sem nova autorização explícita.

## Gates ainda externos

1. adicionar `glicocontrol://auth-callback` à allowlist de Redirect URLs do Supabase Auth;
2. executar cadastro → confirmação por e-mail → abertura do app em emulador/dispositivo;
3. executar recuperação de senha → deep link → nova senha → novo login;
4. validar sincronização no cliente real com sessão de Auth;
5. validar notificações locais, PDF e compartilhamento em dispositivo físico;
6. executar fluxo Maestro em emulador/dispositivo;
7. somente depois considerar promoção de `agent/fullstack-mvp` para `main`.
