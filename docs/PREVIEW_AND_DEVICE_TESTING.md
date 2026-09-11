# Preview e testes de dispositivo — custo zero

Este documento define o fluxo de acompanhamento do GlicoControl durante o desenvolvimento.

## Regra financeira

- Vercel: somente plano Hobby / recursos sem cobrança.
- GitHub Actions: somente runners padrão do repositório público.
- Expo Development Build: gerado pelo GitHub Actions, sem EAS Build obrigatório.
- Firebase Test Lab: somente projeto Spark e dentro das cotas sem custo.
- Não vincular billing/Blaze e não ativar add-ons pagos.

## 1. GitHub → Vercel Preview

O repositório contém `vercel.json` com:

- `npm run build:web`;
- `EXPO_PUBLIC_DEMO_MODE=demo-local` apenas para o preview web;
- saída `dist`;
- headers COOP/COEP exigidos pelo `expo-sqlite` no navegador;
- headers básicos de segurança.

Configuração inicial, uma única vez no Vercel:

1. New Project → Import Git Repository.
2. Selecionar `tupiniquimtechsolution-blip/GlicoControl-MVP`.
3. Manter o plano Hobby.
4. O `vercel.json` define build/output; não cadastrar secrets do Supabase no preview demo.
5. Manter `main` como Production Branch. Branches de desenvolvimento, incluindo `agent/fullstack-mvp`, serão Preview Deployments.

Depois do import, pushes/PRs passam a gerar URLs de preview automaticamente.

## 2. Android Development Build

Workflow: `.github/workflows/android-development-build.yml`.

Ele:

- usa Node 22 + Java 17 + Android SDK 36;
- instala `expo-dev-client` 57.0.18 de forma pinada somente no ambiente de build;
- executa `expo prebuild`;
- compila `app-debug.apk`;
- publica o artifact `glicocontrol-development-client` por 7 dias.

O Development Build abre o launcher do Expo Dev Client e pode ser conectado a um Metro local/túnel para inspeção nativa durante desenvolvimento.

Com o código clonado no computador:

```bash
npm ci
npx expo start --dev-client --tunnel
```

Esse fluxo não substitui o APK standalone de teste; ele serve para acompanhar mudanças nativas com ciclo rápido.

## 3. Firebase Test Lab

Usar exclusivamente o plano Spark. Limites atuais do Spark devem ser conferidos antes de cada automação; a política do projeto é não habilitar Blaze/billing.

Configuração inicial externa:

1. Criar um projeto Firebase no plano Spark, sem método de pagamento.
2. Abrir Test Lab e confirmar que o projeto continua Spark.
3. Usar primeiro Robo Test com um único dispositivo virtual por execução.
4. Nunca aumentar matriz/dispositivos automaticamente sem verificar a cota gratuita.

A automação CI com `gcloud firebase test android run` só deve ser ativada depois de existir um projeto Firebase Spark e autenticação segura via Workload Identity Federation; não armazenar chave JSON de service account no repositório.

## Gates

- Web preview: navegação e componentes no Vercel.
- Development Build: comportamento nativo Android em aparelho do desenvolvedor.
- Maestro Emulator Gate: fluxo canônico automatizado em emulador.
- Firebase Test Lab: compatibilidade em dispositivos Google hospedados.
- Dispositivo físico: notificações, PDF, compartilhamento, deep links e Auth real.

Nenhum desses gates, isoladamente, autoriza promoção para `main`.
