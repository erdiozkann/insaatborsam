#!/usr/bin/env bash
# PostToolUse quick audit — Edit/Write sonrası değişen dosyada hızlı risk taraması.
# YALNIZCA rapor verir (Claude'a additionalContext olarak); otomatik düzeltme yok.
set -uo pipefail

INPUT=$(cat)

read_field() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$INPUT" | jq -r "$1 // empty" 2>/dev/null
  else
    printf '%s' "$INPUT" | node -e '
      let s="";process.stdin.on("data",d=>s+=d);
      process.stdin.on("end",()=>{try{const j=JSON.parse(s);
        const p=process.argv[1].split(".").reduce((o,k)=>(o==null?o:o[k]),j);
        process.stdout.write(p==null?"":String(p));}catch(e){}});
    ' "$2" 2>/dev/null
  fi
}

FILE=$(read_field '.tool_input.file_path' 'tool_input.file_path')
[ -n "$FILE" ] || exit 0

# Yalnızca ilgili kaynak alanları denetle.
case "$FILE" in
  *apps/web/*|*supabase/*|*packages/database/*) ;;
  *) exit 0 ;;
esac
# Vendor/build dizinlerini hariç tut.
case "$FILE" in
  *node_modules/*|*/.next/*|*/dist/*|*/build/*|*/coverage/*) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

F=""
add() { F="${F} | $1"; }

grep -nq    'getSession'                                   "$FILE" 2>/dev/null && add "getSession → getUser kullan"
grep -Eniq  'SERVICE_ROLE|serviceRole'                     "$FILE" 2>/dev/null && add "service_role referansı (client/action'da yasak)"
grep -nq    'console\.log'                                 "$FILE" 2>/dev/null && add "console.log (PII/log riski)"
grep -Enq   '#[0-9a-fA-F]{6}\b'                            "$FILE" 2>/dev/null && add "hardcoded hex (token kullan)"
grep -Enq   '(rounded-|shadow-)'                           "$FILE" 2>/dev/null && add "rounded-/shadow- class (0px radius & shadow yasak)"
grep -Eniq  "from\(['\"]payments['\"]\)\.insert|iyzico|stripe|checkout|payments.*insert" "$FILE" 2>/dev/null && add "ödeme/checkout (pilot ödemesiz — scope dışı?)"

case "$FILE" in
  *supabase/migrations/*) add "MIGRATION değişti — mevcut migration EDIT yasak; yeni dosya + DB test planı gerekir" ;;
esac

if [ -n "$F" ]; then
  BASE=$(basename "$FILE")
  printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"🔍 AUDIT %s:%s"}}' "$BASE" "$F"
fi
exit 0
