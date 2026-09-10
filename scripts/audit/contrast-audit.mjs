/**
 * Auditoria de temas (FASE 0) — estrutura de tokens + contraste WCAG 2.x.
 *
 * Uso:  node scripts/audit/contrast-audit.mjs
 * Saída: tabela de ratios e código de saída != 0 se alguma regra falhar.
 *
 * Critérios aplicados:
 *  - Pares de TEXTO: ratio >= 4.5 (WCAG AA, texto normal).
 *  - Pares de UI/gráficos/estados não textuais: ratio >= 3.0 (WCAG AA, não-texto).
 *
 * Este script lê `src/theme/themes.ts` sem toolchain TypeScript (parse textual
 * do objeto `themes`). É suficiente para o baseline atual; na Fase 1 será
 * substituído por teste Jest importando diretamente os temas compilados.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const themePath = join(here, '..', '..', 'src', 'theme', 'themes.ts');
const src = readFileSync(themePath, 'utf8');

const body = src.slice(src.indexOf('export const themes'), src.indexOf('export const defaultThemeName'));
const objText = body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1);
const themes = eval('(' + objText + ')'); // eslint-disable-line no-eval -- arquivo local versionado, não entrada externa

const expectedTokens = [
  'background', 'surface', 'surfaceAlt', 'primary', 'onPrimary', 'secondary', 'accent',
  'text', 'textMuted', 'border', 'success', 'warning', 'danger', 'info', 'focusRing',
  'chart1', 'chart2', 'chart3', 'chart4',
];

const lum = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const TEXT_PAIRS = [
  ['text', 'background'], ['text', 'surface'], ['text', 'surfaceAlt'],
  ['textMuted', 'background'], ['textMuted', 'surface'], ['onPrimary', 'primary'],
  ['danger', 'surface'], ['warning', 'surface'], ['success', 'surface'], ['info', 'surface'],
];
const UI_PAIRS = [
  ['primary', 'surface'], ['focusRing', 'background'],
  ['danger', 'background'], ['warning', 'background'], ['success', 'background'],
  ['chart1', 'surface'], ['chart2', 'surface'], ['chart3', 'surface'], ['chart4', 'surface'],
];

let failures = 0;
for (const [name, t] of Object.entries(themes)) {
  const tokens = Object.keys(t.colors);
  const missing = expectedTokens.filter((k) => !tokens.includes(k));
  const extra = tokens.filter((k) => !expectedTokens.includes(k));
  const badHex = Object.entries(t.colors).filter(([, v]) => !/^#[0-9A-Fa-f]{6}$/.test(v)).map(([k]) => k);
  for (const list of [missing, extra, badHex]) {
    if (list.length) { failures++; console.error(`${name}: token problem -> ${list.join(', ')}`); }
  }
  for (const [fg, bg] of TEXT_PAIRS) {
    const r = ratio(t.colors[fg], t.colors[bg]);
    const ok = r >= 4.5;
    if (!ok) failures++;
    console.log(`${name}  TEXT ${fg}/${bg}: ${r.toFixed(2)} ${ok ? 'PASS' : 'FAIL'}`);
  }
  for (const [fg, bg] of UI_PAIRS) {
    const r = ratio(t.colors[fg], t.colors[bg]);
    const ok = r >= 3.0;
    if (!ok) failures++;
    console.log(`${name}  UI   ${fg}/${bg}: ${r.toFixed(2)} ${ok ? 'PASS' : 'FAIL'}`);
  }
}
console.log(failures === 0 ? 'CONTRAST AUDIT: PASS (0 falhas)' : `CONTRAST AUDIT: FAIL (${failures} falhas)`);
process.exit(failures === 0 ? 0 : 1);
