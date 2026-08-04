#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for file in ./*.js; do node --check "$file" >/dev/null; done
node tests/e2e-new-features.js
printf '%s\n' 'PASS all JavaScript syntax checks'
printf '%s\n' 'PASS profile legacy-save migration and all profile tabs'
printf '%s\n' 'PASS board confidence status/effective reputation/shop surcharge'
printf '%s\n' 'PASS press conference public flow APIs'
