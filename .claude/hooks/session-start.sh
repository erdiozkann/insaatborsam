#!/usr/bin/env bash
# SessionStart checkpoint — oturum açılışında proje durumunu bağlama enjekte et.
set -uo pipefail

DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$DIR" 2>/dev/null || exit 0

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")

echo "── İnşaat Borsam — Oturum Checkpoint ──"
echo "Branch: $BRANCH"
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "⚠️  main/master üzerindesin — iş için feature branch aç."
fi

echo "Son commit'ler:"
git log --oneline -5 2>/dev/null | sed 's/^/  /'

STATUS=$(git status --short 2>/dev/null | head -15)
if [ -n "$STATUS" ]; then
  echo "Değişiklikler:"
  printf '%s\n' "$STATUS" | sed 's/^/  /'
else
  echo "Working tree: temiz"
fi

if command -v gh >/dev/null 2>&1; then
  PRS=$(gh pr list --state open --limit 5 2>/dev/null | sed 's/^/  /')
  [ -n "$PRS" ] && { echo "Açık PR'lar:"; printf '%s\n' "$PRS"; }
fi

echo "Kural: kullanıcı talimatı OLMADAN commit/merge YOK. Sprint scope'unda kal."
exit 0
