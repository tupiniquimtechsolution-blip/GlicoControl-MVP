#!/usr/bin/env bash
# Varredura de segredos: falha se alguma credencial parecer ter sido commitada.
set -euo pipefail
cd "$(dirname "$0")/../.."
FAIL=0
scan() {
  local name="$1" regex="$2"
  local hits
  hits=$(git grep -nIE -e "$regex" -- . ':!scripts/audit' ':!docs' ':!*.md' || true)
  if [ -n "$hits" ]; then
    echo "FAIL [$name]:"; echo "$hits"; FAIL=1
  else
    echo "ok  [$name]"
  fi
}
scan "supabase service_role key"   'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|service_role["'"'"']?\s*[:=]'
scan "AWS access key id"           'AKIA[0-9A-Z]{16}'
scan "private key block"           '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'
scan "generic api key atribuída"   '(api[_-]?key|secret|token|password)["'"'"']?\s*[:=]\s*["'"'"'][^"'"'"'$<{][^"'"'"']{7,}["'"'"']'
# exceções: chaves de exemplo/vazias usadas em testes/docs
if [ "$FAIL" -eq 0 ]; then echo "SECRET-SCAN: PASS"; else echo "SECRET-SCAN: FAIL"; exit 1; fi
