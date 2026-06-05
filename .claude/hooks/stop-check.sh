#!/usr/bin/env bash
# Stop checkpoint — Claude cevabı bitirince sprint kapanış disiplinini hatırlat.
# Bloklamaz (exit 0); yalnızca hatırlatma.
set -uo pipefail

DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$DIR" 2>/dev/null || exit 0

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  {
    echo "🔖 CHECKPOINT — working tree değişik:"
    echo "  • 'git status' ile değişiklikleri gözden geçir."
    echo "  • 'pnpm --filter @insaatborsam/web typecheck' çalıştır."
    echo "  • Migration değiştiyse DB test planı gerekir (supabase db reset + RPC testleri)."
    echo "  • Commit yalnızca KULLANICI ONAYIYLA."
    echo "  • MERGE yapma (kullanıcı açıkça istemeden)."
  } >&2
else
  echo "✅ CHECKPOINT — working tree temiz." >&2
fi
exit 0
