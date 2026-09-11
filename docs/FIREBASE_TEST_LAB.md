# Firebase Test Lab — configuração zero-cost

Este gate existe somente para validar builds de teste do GlicoControl em dispositivos Android hospedados pelo Firebase Test Lab.

## Regra de custo

- usar um projeto Firebase dedicado exclusivamente a testes;
- manter o projeto no plano **Spark**;
- **não** vincular conta de faturamento;
- não migrar para Blaze;
- executar o workflow manualmente;
- uma execução = uma matriz com **um dispositivo virtual**;
- acompanhar a cota diária no Firebase/Google Cloud.

O plano Spark possui cota gratuita limitada. Quando a cota acabar, aguarde a renovação em vez de habilitar cobrança.

## Projeto recomendado

Criar um projeto separado, por exemplo:

`glicocontrol-testlab`

Não usar dados reais de paciente nesse projeto. O APK executado pelo gate usa:

`EXPO_PUBLIC_DEMO_MODE=demo-local`

Logo, o Test Lab deve exercitar somente dados sintéticos/locais.

## APIs necessárias

No projeto Google Cloud/Firebase de teste, habilitar:

1. Cloud Testing API;
2. Cloud Tool Results API.

## Autenticação do GitHub Actions

Não armazenar chave JSON de service account no GitHub.

Usar Workload Identity Federation (GitHub OIDC) e uma service account exclusiva para o Test Lab.

O workflow espera estas **Repository Variables**:

- `FIREBASE_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

Exemplo de provider esperado pelo action do Google:

`projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github`

A service account deve confiar apenas no repositório:

`tupiniquimtechsolution-blip/GlicoControl-MVP`

Sempre que possível, restringir também por branch/ref no atributo do provider.

## Permissões

O workflow atual usa o bucket de resultados padrão criado/gerenciado pelo Firebase Test Lab. Para testes iniciados via `gcloud`, a documentação do Firebase exige permissões suficientes para criar e acessar esses resultados.

Como este deve ser um **projeto dedicado e sem dados reais**, a configuração inicial mais simples é conceder `Editor` somente à service account de Test Lab dentro desse projeto isolado.

Se quisermos reduzir privilégios no futuro, podemos migrar para um bucket de resultados próprio e usar os papéis granulares recomendados pelo Firebase Test Lab.

## Workflow

Arquivo:

`.github/workflows/firebase-testlab.yml`

Ele é `workflow_dispatch` apenas; não roda automaticamente em todo push.

Etapas:

1. valida as variáveis externas;
2. gera o projeto Android com Expo;
3. compila um APK `release` standalone em modo demo;
4. confirma que `assets/index.android.bundle` está dentro do APK;
5. valida a assinatura;
6. autentica no Google Cloud com OIDC/WIF;
7. lista o modelo selecionado;
8. executa um Robo Test em um único dispositivo virtual.

Defaults:

- modelo: `MediumPhone.arm`;
- Android: `34`;
- locale: `pt_BR`;
- orientação: portrait;
- timeout: `5m`.

Os campos de modelo, versão Android e timeout podem ser alterados no disparo manual caso o catálogo atual do Test Lab mude.

## APK standalone

Antes de conectar Firebase, o repositório possui um gate separado:

`.github/workflows/android-standalone-test.yml`

Esse workflow comprova que o APK de teste:

- compila em `release`;
- inclui o JavaScript bundle;
- é assinado/instalável;
- funciona sem Metro;
- pode ser usado pelo Test Lab.

## Critério para ativar o gate

Só executar o Firebase Test Lab quando todos estes itens forem verdadeiros:

- projeto Firebase existe;
- plano exibido como Spark;
- billing não está vinculado;
- APIs necessárias estão habilitadas;
- WIF está configurado;
- as três Repository Variables estão configuradas;
- standalone APK gate está verde.
