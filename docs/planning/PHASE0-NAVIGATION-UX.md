# FASE 0 — Navegação e Fluxos UX (incl. Temas e Acessibilidade)

Cobre o item 6 do gate, concretizando §6–§14 do prompt mestre e `docs/THEME_SYSTEM.md`.

## 1. Mapa de navegação (expo-router)

```
app/
├─ _layout.tsx                    # providers: Theme → Auth → Network/Sync → Notifications
├─ (auth)/
│  ├─ welcome.tsx                 # apresentação + "Criar conta" / "Entrar"
│  ├─ sign-up.tsx                 # e-mail+senha → consentimento LGPD → primeiro acesso
│  ├─ sign-in.tsx
│  └─ reset-password.tsx          # e-mail de recuperação
└─ (app)/                         # protegido: redirect p/ (auth) se sem sessão
   ├─ _layout.tsx                 # Tabs: Início | Calendário | Registrar | Lembretes | Relatórios
   ├─ index.tsx                    # Dashboard
   ├─ calendar/index.tsx           # mês navegável
   ├─ calendar/[day].tsx           # dia → lista cronológica + filtros do histórico
   ├─ register.tsx                 # modal (apresentado por cima dos tabs; fecha após salvar)
   ├─ reminders/index.tsx          # lista de lembretes (medição)
   ├─ reminders/new.tsx · [id].tsx # criar/editar (horário, dias, snooze, ativar)
   ├─ medications/index.tsx        # lista de medicamentos + schedules
   ├─ medications/new.tsx · [id].tsx
   ├─ reports/index.tsx            # seleção de mês + banner "mês anterior disponível"
   ├─ reports/[month].tsx          # preview → gerar PDF → compartilhar (explícito)
   └─ settings/…                   # menu do header: Perfil · Tema · Unidades · Lembretes do app ·
                                   # Dados (exportar JSON / excluir conta) · Sobre/LGPD
```

- "Registrar" é aba **de ação**: abre modal com foco imediato no campo de valor.
- Regras de navegação: deep-link de notificação → `register` (glicemia) ou tela de log (medicamento);
  back-safe em toda escrita (nenhuma confirmação nativa bloqueante — usar `ConfirmationDialog` do design system).
- Acessibilidade de navegação: `accessibilityRole="tab"`, announced screen title em cada rota.

## 2. Fluxos principais

### 2.1 Registrar medição (meta: ≤ 5 s, ≤ 4 toques após abrir)
1. Valor (NumberInput com teclado numérico decimal; unidade padrão do perfil com troca por chip `mg/dL ⇄ mmol/L` — conversão ao vivo do visor, sem alterar o que foi digitado).
2. Contexto (chips: Jejum, Antes/Depois café, Almoço, Jantar, Dormir, Madrugada, Exercício, Outro — rótulos completos visíveis).
3. Data/hora pré-preenchidos "agora" (editáveis via DateTimeField; mudança de data valida dia do mês).
4. Observação opcional (colapsada).
5. **Salvar** → otimista no SQLite + outbox; toast "Medição salva (offline)" quando sem rede.
- Anti duplo-clique: botão entra em `pending` ao submeter; índice único cobre reenvio.
- Valor fora da faixa plausível (20–600 mg/dL / 1–33 mmol/L): dialog de **confirmação de digitação**
  ("O valor informado é fora do intervalo que o app aceita como digitação plausível. Confere se não
  houve erro de digitação?") — sem qualquer orientação clínica (§22).

### 2.2 Dashboard (Início)
Cards (ordem): Última medição (valor grande + unidade + contexto + "há X min/h") · Próxima medição
programada (do lembrete ativo mais próximo) · Próximo medicamento (schedule ativo, com botões de AÇÃO
do usuário: Registrar "Tomei" etc. nunca automáticos) · Resumo do dia (n medições; mín/máx; média do
dia — numérico puro) · Atalhos: Registrar, Relatório do mês. Estados: primeira vez (onboarding
card), offline, sincronizando, erro.

### 2.3 Calendário → Dia → Histórico
Mês com marcação por dia: `n medições` (número textual — nunca só bolinha colorida); dia sem
registro = contagem `0` com estilo "vazio"; hoje destacado por borda + label "hoje". Toque →
`[day]` com lista cronológica (MeasurementCard editáveis: editar/excluir com confirmação).
"Filtros" abre painel: intervalo de datas, contexto, unidade de exibição. Virada de mês:
animação ≤ 200 ms (Emil-style, discreta) e re-fetch local (não bloqueia toque).

### 2.4 Lembretes (medição)
Lista + `new`: nome, horário, dias da semana (7 toggles com label D S T Q Q S D), repetição,
snooze (5/10/15/30/60/nil), ativar/desativar. Notificação com 3 ações: **Registrar agora** (abre
register pré-datado), **Lembrar depois** (snooze N min re-agenda localmente), **Marcar como
realizada** (abre register com contexto pré-selecionado — o registro em si continua manual).
Editar = cancel-all + re-schedule do conjunto.

### 2.5 Medicamentos
Cadastro (nome, dose em texto livre, instruções, ativo/inativo) + horários (time+days, múltiplos).
Notificação → ações **Tomei / Adiar / Ignorar**; cada toque grava `medication_logs`
(taken/snoozed/skipped, `logged_at`=agora, `schedule_id`). "Adiar" re-agenda +10 min. Nada é
registrado automaticamente; a tela deixa isso explícito em texto ("Ações refletem o que VOCÊ registrou").

### 2.6 Relatório mensal → PDF → compartilhar
`reports/[month]` renderiza do SQLite (funciona offline; dados podem estar "pendentes de sincronização" —
banner informativo no PDF? NÃO: o PDF reflete o espelho local; um rodapé registra `gerado em` +
`registros incluídos: n`, e um aviso acima do botão compartilhamento lista pendências locais).
Conteúdo do PDF (§12 do prompt mestre, na ordem): cabeçalho (nome, mês/ano, data/hora de geração,
unidade) → KPIs (total, dias com registro, dias sem, média, mín, máx) → gráfico de evolução
(tendência por dia com marcadores + legenda textual) → média por contexto (barras + valores numéricos)
→ tabela completa Data|Hora|Contexto|Glicemia|Observação → destaque textual "Dias sem registro: X, Y, Z"
→ rodapé "Documento gerado pelo paciente no GlicoControl. Não constitui avaliação médica."
Compartilhar: sheet nativo (WhatsApp/arquivos/e-mail) **somente após toque explícito**; histórico
de compartilhamento NÃO é registrado (minimização).
Banner "Novo mês começou — gerar relatório de {mês anterior}" na tela Início (1 display por mês).

## 3. Temas na UI (item adicional do gate)

- Seletor em Settings → Tema: 5 cards de prévia (paleta + amostra de texto), `system` já como
  opção prevista (`useColorScheme`); persistência imediata em `profiles.theme` + AsyncStorage (overlay local).
- Regra estrutural: componentes só consomem `useAppTheme().colors.*`; proibição de hex fora de
  `src/theme` será garantida por lint (Fase 1). Gráficos: séries por `chart1..4` **mais** marcadores
  de forma distintos (●,▲,■) e legenda textual — nunca cor como única informação.

## 4. Acessibilidade (checklist verificável, Fase 1+ em testes)

- Alvos de toque ≥ 44×44 pt (botões primários 56).
- Todo `TextInput/NumberInput` com label associada e `accessibilityLabel` em ícones.
- Estados combinam ícone + texto (ex.: "salvo neste aparelho", "fora da sua meta configurada").
- Erros de formulário: `accessibilityLiveRegion="polite"` + foco no primeiro erro.
- `allowFontScaling` ligado em 100% dos textos; layout testado em escala máx Android / Dynamic Type iOS (truncamento é bug de release).
- Contraste: medido no baseline (PASS, ver PHASE0-AUDIT.md) + teste automatizado por componente na Fase 1.
- Navegação por leitores de tela: ordem DOM = ordem visual; tabs anunciam posição ("3 de 5").
- Sem animação para `reduceMotion` (Expo `useReducedMotion`); motion padrão ≤ 200 ms e utilitário.
