# Firebase Test Lab — configuração zero-cost

Este gate existe somente para validar builds de teste do GlicoControl em dispositivos Android hospedados pelo Firebase Test Lab.

## Projeto canônico de testes

Projeto Firebase dedicado:

`teste-d2d1d`

Este é o único projeto permitido pelo workflow atual.

Não usar dados reais de paciente neste projeto. O APK executado pelo gate usa:

`EXPO_PUBLIC_DEMO_MODE=demo-local`

Logo, o Test Lab deve exercitar somente dados sintéticos/locais.

## Regra de custo

- manter `teste-d2d1d` no plano **Spark**;
- **não** vincular conta de faturamento;
- não migrar para Blaze;
- executar o workflow manualmente;
- uma execução = uma matriz com **um dispositivo virtual**;
- acompanhar a cota diária no Firebase/Google Cloud;
- quando a cota gratuita acabar, aguardar a renovação em vez de habilitar cobrança.

## APIs necessárias

No projeto Google Cloud/Firebase `teste-d2d1d`, habilitar:

1. Cloud Testing API;
2. Cloud Tool Results API.

## Autenticação do GitHub Actions

Não armazenar chave JSON de service account no GitHub.

Usar Workload Identity Federation (GitHub OIDC) e uma service account exclusiva para o Test Lab.

O workflow já fixa:

`FIREBASE_PROJECT_ID=teste-d2d1d`

Ele espera somente estas **Repository Variables**:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

Formato esperado do provider:

`projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github`

A service account deve confiar apenas no repositório:

`tupiniquimtechsolution-blip/GlicoControl-MVP`

No provider WIF, restringir o atributo para que apenas esse repositório possa trocar tokens GitHub OIDC por credenciais Google Cloud.

## Permissões

Para testes iniciados via `gcloud` usando o bucket de resultados padrão criado pelo Firebase Test Lab, a documentação oficial exige que a identidade executora possua `roles/editor` no projeto Firebase.

Como `teste-d2d1d` é um projeto dedicado exclusivamente a testes, sem dados reais de paciente e sem billing, a configuração adotada é:

- service account exclusiva para Test Lab;
- `roles/editor` somente dentro de `teste-d2d1d`;
- nenhuma permissão em outros projetos;
- nenhuma chave JSON de longa duração.

Se no futuro migrarmos para um bucket próprio, podemos reduzir privilégios usando os papéis granulares recomendados pelo Firebase Test Lab.

## Workflow

Arquivo:

`.github/workflows/firebase-testlab.yml`

Ele é `workflow_dispatch` apenas; não roda automaticamente em todo push.

Etapas:

1. valida que o projeto é exatamente `teste-d2d1d`;
2. valida as duas Repository Variables de WIF;
3. gera o projeto Android com Expo;
4. compila um APK `release` standalone em modo demo;
5. confirma que `assets/index.android.bundle` está dentro do APK;
6. valida a assinatura;
7. autentica no Google Cloud com OIDC/WIF;
8. lista o modelo selecionado;
9. executa um Robo Test em um único dispositivo virtual.

Defaults:

- modelo: `MediumPhone.arm`;
- Android: `34`;
- locale: `pt_BR`;
- orientação: portrait;
- timeout: `5m`.

Os campos de modelo, versão Android e timeout podem ser alterados no disparo manual caso o catálogo atual do Test Lab mude.

## APK standalone

Antes de ativar Firebase, o repositório possui um gate separado:

`.github/workflows/android-standalone-test.yml`

Esse workflow comprova que o APK de teste:

- compila em `release`;
- inclui o JavaScript bundle;
- é assinado/instalável;
- funciona sem Metro;
- pode ser usado pelo Test Lab.

## Critério para ativar o gate

Só executar o Firebase Test Lab quando todos estes itens forem verdadeiros:

- `teste-d2d1d` existe;
- plano exibido como Spark;
- billing não está vinculado;
- Cloud Testing API está habilitada;
- Cloud Tool Results API está habilitada;
- WIF está configurado;
- `GCP_WORKLOAD_IDENTITY_PROVIDER` está configurada no GitHub;
- `GCP_SERVICE_ACCOUNT` está configurada no GitHub;
- standalone APK gate está verde.
