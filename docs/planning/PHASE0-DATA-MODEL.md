# FASE 0 — Modelo de Dados (Supabase / Postgres)

Cobre o item 3 do gate. Convenções aplicadas a TODAS as tabelas de dados do paciente:

- `user_id uuid not null references auth.users(id) on delete cascade` — associação segura obrigatória (§15 do prompt mestre). Toda consulta do app filtra implicitamente por RLS; o filtro explícito `user_id = auth.uid()` é mantido no repositório também (defesa em profundidade + performance).
- Chaves primárias `uuid`: **geradas no cliente** (UUIDv7, ordenável) quando houver criação offline; no servidor `default gen_random_uuid()` cobre criação direta. Idempotência de sync depende disso.
- `created_at` / `updated_at timestamptz not null default now()` (`updated_at` por trigger `set_updated_at`).
- `row_version bigint not null default 1` (incrementado por trigger) e `deleted_at timestamptz null` (soft delete) nas tabelas sincronizáveis — base do algoritmo em `PHASE0-OFFLINE-SYNC.md`.
- Nomes em inglês no banco; rótulos pt-BR vivem no app (domínio).
- Tipos: `numeric` para valores (nunca float binário); `date`/`time` para campos locais puros; `timestamptz` para instantes; enum `text + check` (mais fácil de evoluir em migration do que enum nativo).

## Entidades

### `profiles` (1:1 com `auth.users`)
```
id uuid PK = auth.users.id
display_name text (2..80, opcional)
unit text not null default 'mg/dL' check (unit in ('mg/dL','mmol/L'))
locale text not null default 'pt-BR'
timezone text            -- IANA ('America/Sao_Paulo'); sincronizado do device
theme text not null default 'system' check (theme in ('pastelCalm','greenWhite','yellowWhite','blackWhite','blackYellow','system'))
onboarding_completed boolean not null default false
consent_at timestamptz     -- aceite explícito (dados de saúde = dado sensível, LGPD art. 11 §1º III)
consent_version text        -- hash/versão do termo exibido; registro imutável (append via history table se evoluir)
created_at / updated_at
```
Sem `deleted_at`: exclusão de conta remove o usuário (cascade físico) — ver LGPD em `PHASE0-RISKS.md`.

### `glucose_measurements`
```
id uuid PK
user_id uuid not null → auth.users
value numeric(6,2) not null check (value > 0)
unit text not null check (unit in ('mg/dL','mmol/L'))
measured_at timestamptz not null          -- instante absoluto (para ordenação global/dedup)
local_date date not null                  -- dia LOCAL do paciente no registro (chave do calendário/relatório)
local_time time not null                  -- hora local (par com local_date; estável a mudanças de TZ)
tz_name text not null                     -- IANA no momento do registro (auditoria da localidade)
context text not null check (context in (
  'fasting',
  'before_breakfast','after_breakfast',
  'before_lunch','after_lunch',
  'before_dinner','after_dinner',
  'before_bed','midnight',
  'before_exercise','after_exercise',
  'other'))
note text check (char_length(note) <= 500) -- opcional
created_at/updated_at/row_version/deleted_at
```
Índices: `(user_id, local_date desc, local_time desc)` (calendário/histórico) e único parcial
`(user_id, local_date, local_time, context) where deleted_at is null` — **deduplicação** de
registro duplo acidental (double-submit) no mesmo minuto/contexto. `value` é armazenado na
unidade em que o usuário digitou + `unit`; conversão é exibicional (evita erro de acumulação).

### `reminders` (lembretes de medição)
```
id uuid PK; user_id → auth.users
label text not null (1..40)              -- nome do lembrete
time_of_day time not null
days_of_week smallint[] not null default '{0,1,2,3,4,5,6}'
   check (cardinality>=1 and cada elemento in 0..6, ordenado/sem duplicatas via função)
repeat text check (repeat in ('once','daily','weekly')) default 'weekly'
snooze_minutes int check (0..240) default 10
enabled boolean not null default true
created_at/updated_at/row_version/deleted_at
```
`repeat='once'`: agenda pontual; após disparo o app marca `enabled=false` (ações "Registrar agora"/
"Marcar como realizada" viram log, não mudança automática de dado clínico). IDs de notificação
dispositivo-específicas ficam SÓ no SQLite local (nunca no banco central).

### `medications`
```
id uuid PK; user_id → auth.users
name text not null (1..80)
dose_text text not null (1..60)   -- TEXTO LIVRE digitado pelo paciente ("1 comprimido de 500 mg").
                                   -- O sistema NUNCA parseia, calcula, valida dose ou sugere ajuste.
instructions text (<=200)         -- ex.: "tomar com água" (registro, não prescrição)
active boolean not null default true
created_at/updated_at/row_version/deleted_at
```

### `medication_schedules`
```
id uuid PK; user_id; medication_id uuid not null → medications(id) on delete cascade
   FK composta: (medication_id, user_id) → medications(id, user_id) -- impede referência a medicamento de OUTRO usuário (ver PHASE0-RLS.md §4)
time_of_day time not null
days_of_week smallint[] (mesmas regras de reminders)
enabled boolean default true
position smallint default 0        -- ordem na tela (2 horários no mesmo dia)
created_at/updated_at/row_version/deleted_at
```

### `medication_logs`
```
id uuid PK; user_id; medication_id → medications; schedule_id → medication_schedules (nullable)
action text not null check (action in ('taken','snoozed','skipped'))
logged_at timestamptz not null default now()   -- instante da AÇÃO DO USUÁRIO, nunca derivado da notificação
note text (<=200, opcional)
created_at/updated_at/row_version/deleted_at
```
Tabela de **apenas inserir** na prática: edição/deleção apenas via `deleted_at` (auditoria de adesão).
Sem ela, "Tomei/Adiar/Ignorar" não teria persistência. Regra inviolável: o disparo de notificação
**não** cria log; só toque do usuário cria.

### `glucose_targets` (valores configurados — não clínicos)
```
id uuid PK; user_id
context text not null check (context in ('any', <contextos acima>))
unit text not null check (in mg/dL,mmol/L)
min_value numeric(6,2) check (>0)
max_value numeric(6,2) check (> min_value)
set_by text check (set_by in ('patient','professional')) default 'patient'
notes text (<=200)
created_at/updated_at/row_version/deleted_at
unique (user_id, context, unit) where deleted_at is null
```
Uso: banda de referência **exibicional** ("abaixo/acima da sua meta configurada"). O app não
interpreta, não alerta terapeuticamente, não sugere mudança de conduta. Se o usuário não
configurar metas, nada é exibido.

### `report_metadata` — **decisão: NÃO criar**
§15 permite "somente se realmente necessário". O relatório mensal é 100% reconstruível das
medições; gerar snapshot por mês duplicaria dado clínico no banco (contra minimização/LGPD).
O "Histórico de relatórios" do `docs/PRODUCT_SCOPE.md` = regeneração sob demanda por mês; o
sinal "gerar relatório do mês anterior" é derivado no cliente (1º acesso após virada de mês).
PDF gerados vivem no dispositivo do usuário, não no servidor.

## Migrações previstas (Fase 2, uma por responsabilidade, sempre reversíveis com down ou documentadas)
```
0001_extensions.sql      -- pgcrypto (gen_random_uuid já nativo no PG15+)
0002_functions.sql       -- set_updated_at(), bump_row_version(), validação days_of_week()
0003_profiles.sql
0004_glucose_measurements.sql (+ triggers + índices)
0005_reminders.sql
0006_medications.sql     -- medications + medication_schedules (FK composta)
0007_medication_logs.sql
0008_glucose_targets.sql
0009_rls.sql             -- habilita RLS + policies (ver PHASE0-RLS.md)
0010_grants.sql          -- revoke anon, grant authenticated
```

## Conversões e unidades (domínio, testado unitariamente)
- `mg/dL → mmol/L`: divide por 18.0182, arredonda a 1 decimal (padrão BR/IFCC).
- `mmol/L → mg/dL`: multiplica por 18.0182, arredonda a inteiro.
- Estatísticas do relatório: convertidas para a unidade preferida do perfil **antes** da agregação
  (média de números já na unidade de exibição; documentado para evitar ambiguidade de médias mistas).

## O que este modelo deliberadamente NÃO tem
- CGM/glicosímetro/Bluetooth; prontuário; portal médico; IA/RAG/chat (fora do MVP — `PRODUCT_SCOPE`).
- Colunas de "classificação clínica" (norma/atenção) persistidas no servidor: derivação de
  exibição a partir das metas opcionais do usuário, nunca armazenada no banco.
