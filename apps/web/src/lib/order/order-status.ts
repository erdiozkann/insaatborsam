// apps/web/src/lib/order/order-status.ts
// orders.status + orders.payment_status için merkezi label/rozet eşlemesi.
//
// DB CHECK (migration 20260519000030_orders.sql):
//   status IN ('pending_payment','paid','confirmed','preparing','ready_to_ship',
//              'shipped','delivered','cancelled','refunded')
//   payment_status IN ('pending','paid','failed','refunded')
//
// Sprint 7: sipariş yalnızca 'pending_payment' durumunda oluşur (ödeme yok).
// Diğer durumlar ödeme/operasyon sprint'lerinde (Sprint 8+) aktif olur.
// Bilinmeyen status → güvenli fallback.

type StatusTone = 'neutral' | 'success' | 'danger' | 'muted'

type Meta = { label: string; tone: StatusTone }

const ORDER_STATUS_META: Record<string, Meta> = {
  pending_payment: { label: 'Ödeme Bekleniyor', tone: 'neutral' },
  paid: { label: 'Ödendi', tone: 'success' },
  confirmed: { label: 'Onaylandı', tone: 'success' },
  preparing: { label: 'Hazırlanıyor', tone: 'neutral' },
  ready_to_ship: { label: 'Sevkiyata Hazır', tone: 'neutral' },
  shipped: { label: 'Kargoya Verildi', tone: 'neutral' },
  delivered: { label: 'Teslim Edildi', tone: 'success' },
  cancelled: { label: 'İptal Edildi', tone: 'danger' },
  refunded: { label: 'İade Edildi', tone: 'muted' },
}

const PAYMENT_STATUS_META: Record<string, Meta> = {
  pending: { label: 'Ödeme Yapılmadı', tone: 'muted' },
  paid: { label: 'Ödendi', tone: 'success' },
  failed: { label: 'Başarısız', tone: 'danger' },
  refunded: { label: 'İade Edildi', tone: 'muted' },
}

const FALLBACK: Meta = { label: 'Bilinmeyen Durum', tone: 'muted' }

/** Token-bazlı rozet sınıfı (hex yok, Industrial Precision). */
function toneClass(tone: StatusTone): string {
  switch (tone) {
    case 'success':
      return 'text-state-success border border-state-success'
    case 'danger':
      return 'text-state-error border border-state-error'
    case 'neutral':
      return 'text-navy border border-navy'
    default:
      return 'text-ink-muted border border-border'
  }
}

export function orderStatusLabel(status: string): string {
  return (ORDER_STATUS_META[status] ?? FALLBACK).label
}

export function orderStatusBadgeClass(status: string): string {
  return toneClass((ORDER_STATUS_META[status] ?? FALLBACK).tone)
}

export function paymentStatusLabel(status: string): string {
  return (PAYMENT_STATUS_META[status] ?? FALLBACK).label
}

export function paymentStatusBadgeClass(status: string): string {
  return toneClass((PAYMENT_STATUS_META[status] ?? FALLBACK).tone)
}
