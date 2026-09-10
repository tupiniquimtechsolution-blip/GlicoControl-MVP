# E2E (Maestro)

`canonical-flow.yaml` cobre o fluxo canônico: login → registro → dashboard → histórico →
calendário → lembrete → medicamento (log por toque) → relatório PDF → compartilhar.

O `appId` canônico deve ser sempre o mesmo `expo.android.package` de `app.json`:
`app.tupiniquim.glicocontrol`. O CI valida essa consistência automaticamente.

Execução requer um dispositivo real ou emulador Android com o app instalado. O build nativo
pode ser validado no GitHub Actions por runner padrão; a interação Maestro exige um device ou
emulador inicializado.

Passos no host:

```bash
npm run android            # ou npx expo run:android
maestro test e2e/canonical-flow.yaml
```

Os `testID` referenciados existem nas telas (register-value, login-email, tab-* etc.).
A conta E2E deve ser efêmera/de teste e suas credenciais nunca devem ser commitadas como
segredo de produção. Para execução automatizada futura, fornecer credenciais apenas pelo
ambiente seguro da execução e removê-las ao fim do gate.

Se algum selector divergir após refactor, os testes de fluxo em
`src/__tests__/flows.test.tsx` continuam cobrindo o mesmo core/repositórios/provider, mas
não substituem o gate Maestro em dispositivo/emulador.
