# Quality Gates

## Gate por fase

- lint PASS;
- typecheck PASS;
- unit tests PASS;
- integration tests PASS quando aplicável;
- revisão do diff;
- documentação atualizada.

## Gate pré-release

- E2E do fluxo principal PASS;
- RLS/security tests PASS;
- build Android validado;
- build iOS validado quando ambiente disponível;
- acessibilidade básica validada;
- notificações locais validadas em device/build de desenvolvimento;
- PDF validado com mês completo e dias sem registro;
- secret scanning PASS;
- dependency audit sem vulnerabilidade crítica/alta não tratada;
- backup/restauração do banco testados;
- política de privacidade/termos revisados antes de publicação pública.

## E2E crítico

Conta → lembrete → registro → dashboard → calendário → relatório → PDF → compartilhamento.
