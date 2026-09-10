# E2E (Maestro)

`canonical-flow.yaml` cobre o fluxo canônico: login → registro → dashboard → histórico →
calendário → lembrete → medicamento (log por toque) → relatório PDF → compartilhar.

Execução requer um dispositivo real ou emulador (Android/iOS) com o app instalado —
**não é possível rodar dentro deste sandbox**. Passos no host:

```bash
npm run android            # ou npx expo run:android (dev build com ids dos testID)
maestro test e2e/canonical-flow.yaml
```

Os `testID` referenciados existem nas telas (register-value, login-email, tab-* etc.).
Se algum selector divergir após refactor, o gate CI "maestro (se disponível)" não roda —
a equivalência em sandbox é garantida pelos testes de fluxo (`src/__tests__/flows.test.tsx`)
que exercitam o MESMO core/repositórios/provider com memória injetável.
