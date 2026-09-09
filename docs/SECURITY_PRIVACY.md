# Segurança, Privacidade e LGPD — Baseline

## Classificação

Medições de glicemia e informações de medicamentos são dados de saúde e exigem proteção elevada.

## Princípios

- minimização de dados;
- finalidade clara;
- consentimento/base legal apropriada;
- acesso do titular;
- exportação;
- exclusão conforme regras aplicáveis;
- retenção documentada;
- compartilhamento explícito;
- segurança por padrão.

## Autorização

Toda tabela pertencente ao paciente deve possuir `user_id` e políticas RLS que impeçam acesso horizontal.

Testes obrigatórios devem provar que:

- usuário A não lê dados de B;
- usuário A não altera dados de B;
- usuário A não exclui dados de B.

## Secrets

- `.env*` real fora do Git.
- somente `.env.example` sem valores.
- nunca incluir service-role key no app.
- usar somente chaves públicas/publishable apropriadas no cliente, protegidas por RLS.

## Logs

Não logar por padrão:

- valores de glicemia;
- nomes/doses de medicamentos;
- tokens;
- cookies;
- credenciais;
- payloads clínicos completos.

## Compartilhamento

Nenhum relatório deve ser enviado automaticamente a médico, clínica, WhatsApp, e-mail ou terceiro. O usuário inicia o compartilhamento.

## Segurança de conta

- recuperação de senha segura;
- rate limiting;
- proteção contra enumeração quando aplicável;
- sessão armazenada de forma adequada à plataforma;
- logout e revogação de sessão.

## Release gate

Antes de produção:

- secret scan;
- dependency audit;
- SAST;
- testes RLS;
- revisão de logs;
- revisão de permissões mobile;
- teste de backup/restauração;
- pentest autorizado do próprio ambiente quando disponível.

## Regulação

Antes de distribuição pública, realizar análise jurídica/regulatória específica sobre LGPD, termos, política de privacidade e eventual enquadramento regulatório conforme funcionalidades efetivamente lançadas.
