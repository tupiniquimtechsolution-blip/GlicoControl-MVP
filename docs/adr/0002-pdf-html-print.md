# ADR 0002 — PDF do relatório via HTML + expo-print (sem serviço externo de PDF)

**Status:** aceito (FASE 1). **Data:** 2026-09-09.

## Contexto
Exigência: PDF real com estatísticas, gráfico, tabela completa (todos os campos) e dias sem registro,
gerado no aparelho e compartilhado somente por toque explícito do paciente.

## Decisão
Gerar HTML paginado (gráfico SVG do domínio `reports/chart-spec.ts`) e converter com
`expo-print.printToFileAsync({ html })` — zero dependência de terceiros; dados nunca saem do aparelho
até o usuário escolher compartilhar (`expo-sharing`).

## Consequências
- Render é **light theme only** (rodapé do PDF documenta): cores do tema do app não se aplicam ao papel — legibilidade/economia de tinta.
- Famílias de fonte restritas às do SO; sem marcas d'água no MVP.
- Teste `pdf-report` aserta no HTML: média/mín/máx, contagens, cada medição (data, hora, valor, unidade, contexto, observação) e os dias sem registro rotulados.
- Troca futura p/ WeasyPrint em job server-side é isolada: a tela só consome `buildReportHtml`.
