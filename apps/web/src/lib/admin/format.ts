// apps/web/src/lib/admin/format.ts
// Admin paneli için paylaşılan biçimlendirme yardımcıları (TRY/tarih/birim).
// Tüm para gösterimi cents → ₺ (BIGINT cent disiplini korunur, float hesabı yok).

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const UNIT_LABELS: Record<string, string> = {
  m2: 'm²', m3: 'm³', metre: 'Metre', ton: 'Ton', kg: 'Kg',
  adet: 'Adet', paket: 'Paket', kutu: 'Kutu', litre: 'Litre', cuval: 'Çuval',
}

export function unitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? unit
}
