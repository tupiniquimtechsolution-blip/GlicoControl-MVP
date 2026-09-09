#!/usr/bin/env bash
# Porta de segurança clínica: textos/proibidos nunca devem aparecer em telas ou prompts.
# Complementa o teste jest clinical-language-gate (que varre a árvore inteira).
set -euo pipefail
cd "$(dirname "$0")/../.."
PATTERNS=(
  'você (tem|está) (diabético|diabetes|com diabetes)'
  '(suspenda|pare|interrumpa|descontinue) .*(medicação|insulina|remédio|medicamento)'
  '(aumente|reduza|diminua|adicione|ajuste) .*(dose|insulina|gliclazida|metformina)'
  '(sua dose deve|dose recomendada|calculamos .*(dose|insulina)|insulina (sugerida|recomendada))'
  'hipoglicemia confirmada'
  '(está (em|sob) controle|fora de controle|complicação)'
)
FAIL=0
for p in "${PATTERNS[@]}"; do
  # linhas de código-fonte (ignora comentários //, *, e testes que referenciam a própria regra)
  hits=$(grep -rnEi "$p" src --include='*.ts' --include='*.tsx' 2>/dev/null | grep -vE '^[^:]+:[0-9]+:\s*(//|\*|/\*)' | grep -v '__tests__' || true)
  if [ -n "$hits" ]; then echo "FAIL [/$p/]:"; echo "$hits"; FAIL=1; fi
done
if [ "$FAIL" -eq 0 ]; then echo "FORBIDDEN-TEXTS: PASS"; else echo "FORBIDDEN-TEXTS: FAIL"; exit 1; fi
