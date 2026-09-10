# Theme System

O aplicativo terá cinco temas selecionáveis. Todos usam tokens semânticos em vez de cores hardcoded em componentes.

## Identificadores canônicos

| ID | Nome exibido |
|---|---|
| `pastelCalm` | Pastel Calm |
| `greenWhite` | Verde / Branco |
| `yellowWhite` | Amarelo / Branco |
| `blackWhite` | Preto / Branco |
| `blackYellow` | Preto / Amarelo |

Esses IDs são contrato do produto e devem permanecer sincronizados com `src/theme/themes.ts` e `src/theme/palette.ts`.

## Temas

### Pastel Calm

Visual acolhedor, leve e não hospitalar, com verde sálvia, pêssego e azul-lavanda suaves.

### Verde / Branco

Tema claro principal, associando saúde e estabilidade sem depender da cor para estado clínico.

### Amarelo / Branco

Tema claro energético. Amarelo forte é usado principalmente como acento; textos usam tom escuro para contraste.

### Preto / Branco

Tema escuro neutro e de alto contraste.

### Preto / Amarelo

Tema escuro com amarelo como acento de navegação/ação.

## Regras

- Não usar cor como único sinal de normal/atenção/erro.
- Estados devem ter texto/ícone/label.
- Componentes usam `theme.colors.*`.
- Gráficos devem ter legenda e marcadores distintos.
- Garantir contraste adequado em textos e controles.
- Suportar fonte dinâmica e leitor de tela.
- Persistir preferência do usuário.
- Possibilitar opção futura `system` para seguir tema do SO.
