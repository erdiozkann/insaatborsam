#!/usr/bin/env bash
# UserPromptSubmit scope reminder — her yeni prompt'ta proje scope'unu bağlama enjekte et.
set -uo pipefail

cat <<'EOF'
── İnşaat Borsam Scope Hatırlatması ──
• Türkiye first · Web first · Mobile later.
• Payment: pilot + admin + lojistik hazır olana kadar ERTELENMİŞ.
• Transport/nakliye: erken aşamada veri + manuel admin takibi (tam Uber modülü DEĞİL).
• service_role YOK (client/server action'da).
• getSession YOK → getUser kullan.
• Mevcut migration EDIT YOK → yeni migration ekle.
• Commit / merge yalnızca kullanıcı onayıyla.
• Sprint scope dışına çıkma; emin değilsen sor.
EOF
exit 0
