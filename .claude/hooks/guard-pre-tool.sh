#!/usr/bin/env bash
# PreToolUse guard — riskli Bash komutlarını engeller, riskli işlemlerde uyarır.
# Kodu DÜZELTMEZ; yalnızca block (exit 2) veya uyarı (exit 0) üretir.
# macOS/bash uyumlu. JSON parse: jq → node fallback.
set -uo pipefail

INPUT=$(cat)

# --- JSON alan okuma (jq varsa jq, yoksa node) ---
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

TOOL=$(read_field '.tool_name' 'tool_name')
CMD=$(read_field '.tool_input.command' 'tool_input.command')

# Yalnızca Bash komutlarını incele.
[ "$TOOL" = "Bash" ] || exit 0
[ -n "$CMD" ] || exit 0

has() { printf '%s' "$CMD" | grep -Eiq "$1"; }
block() { echo "🚫 HOOK BLOCK: $1" >&2; exit 2; }
warn()  { echo "⚠️  HOOK WARN: $1" >&2; }

# ───────────── HARD BLOCKS ─────────────
has 'git +push.*(--force|-f( |$))'        && block "git push --force yasak (force-push geri alınamaz)."
has 'git +reset +--hard'                  && block "git reset --hard yasak (yerel değişiklik kaybı)."
has 'rm +-rf +(/|\.|\*)( |$|/)'           && block "rm -rf / | . | * yasak (yıkıcı silme)."
# .env okuma/yazma (ama .env.example/.sample/.template serbest)
has '(cat|grep|sed|awk|open|less|more|head|tail|nano|vi|vim|code|xxd|strings) +[^|;&]*\.env(\.local|\.production|\.prod)?([[:space:]]|$|["'\''])' \
  && block ".env dosyalarına erişim yasak (secret sızıntısı). .env.example serbesttir."
has 'SUPABASE_SERVICE_ROLE_KEY'           && block "SUPABASE_SERVICE_ROLE_KEY komut içinde geçemez (secret)."

# main/master üzerinde commit engelle
if has 'git +commit'; then
  BRANCH=$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    block "main/master üzerinde commit yasak — önce feature branch aç."
  fi
fi

# ───────────── UYARILAR (non-blocking) ─────────────
has '(>|>>|sed +-i|tee)[^|]*supabase/migrations/' \
  && warn "supabase/migrations'a shell ile yazım — MEVCUT migration EDIT yasak; yeni migration dosyası ekle."
has 'supabase +db +push'  && warn "supabase db push — PROD şemasını değiştirir; onay/runbook gerekir."
has 'supabase +db +reset' && warn "supabase db reset — local DB sıfırlanır + seed yeniden yüklenir."
has 'gh +pr +merge'       && warn "gh pr merge — MERGE yalnızca kullanıcı onayıyla."
has 'git +commit'         && warn "git commit — commit yalnızca kullanıcı onayıyla."
has 'git +push'           && warn "git push — push yalnızca kullanıcı onayıyla."

exit 0
