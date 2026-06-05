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

// Rozet için temel tip (label + ton). payment_status bunu kullanır.
type BaseMeta = { label: string; tone: StatusTone }

// Sipariş durumu ek olarak taraf-bazlı açıklama taşır.
// buyer  : alıcıya 1. tekil açıklama
// seller : satıcıya 1. tekil açıklama (alıcı PII içermez)
type Meta = BaseMeta & {
  buyer: string
  seller: string
}

const ORDER_STATUS_META: Record<string, Meta> = {
  pending_payment: {
    label: 'Ödeme Bekleniyor',
    tone: 'neutral',
    buyer: 'Ödeme hazırlığı bekleniyor. Ödeme ve teslimat adımı henüz aktif değildir.',
    seller: 'Alıcı ödeme ve adres bilgilerini tamamlayacak. Henüz tahsilat yok.',
  },
  paid: {
    label: 'Ödendi',
    tone: 'success',
    buyer: 'Ödemeniz alındı. Satıcı siparişi hazırlamaya başlayacak.',
    seller: 'Ödeme alındı. Siparişi hazırlamaya başlayabilirsiniz.',
  },
  confirmed: {
    label: 'Onaylandı',
    tone: 'success',
    buyer: 'Siparişiniz satıcı tarafından onaylandı.',
    seller: 'Siparişi onayladınız.',
  },
  preparing: {
    label: 'Hazırlanıyor',
    tone: 'neutral',
    buyer: 'Satıcı siparişinizi hazırlıyor.',
    seller: 'Siparişi hazırlıyorsunuz.',
  },
  ready_to_ship: {
    label: 'Sevkiyata Hazır',
    tone: 'neutral',
    buyer: 'Siparişiniz sevkiyata hazır.',
    seller: 'Sipariş sevkiyata hazır.',
  },
  shipped: {
    label: 'Kargoya Verildi',
    tone: 'neutral',
    buyer: 'Siparişiniz kargoya verildi.',
    seller: 'Siparişi kargoya verdiniz.',
  },
  delivered: {
    label: 'Teslim Edildi',
    tone: 'success',
    buyer: 'Siparişiniz teslim edildi.',
    seller: 'Sipariş teslim edildi.',
  },
  cancelled: {
    label: 'İptal Edildi',
    tone: 'danger',
    buyer: 'Bu sipariş iptal edildi.',
    seller: 'Bu sipariş iptal edildi.',
  },
  refunded: {
    label: 'İade Edildi',
    tone: 'muted',
    buyer: 'Bu sipariş iade edildi.',
    seller: 'Bu sipariş iade edildi.',
  },
}

const PAYMENT_STATUS_META: Record<string, BaseMeta> = {
  pending: { label: 'Ödeme Yapılmadı', tone: 'muted' },
  paid: { label: 'Ödendi', tone: 'success' },
  failed: { label: 'Başarısız', tone: 'danger' },
  refunded: { label: 'İade Edildi', tone: 'muted' },
}

const FALLBACK: Meta = {
  label: 'Bilinmeyen Durum',
  tone: 'muted',
  buyer: 'Sipariş durumu okunamadı.',
  seller: 'Sipariş durumu okunamadı.',
}

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

export function orderStatusBuyerDescription(status: string): string {
  return (ORDER_STATUS_META[status] ?? FALLBACK).buyer
}

export function orderStatusSellerDescription(status: string): string {
  return (ORDER_STATUS_META[status] ?? FALLBACK).seller
}

export function paymentStatusLabel(status: string): string {
  return (PAYMENT_STATUS_META[status] ?? FALLBACK).label
}

export function paymentStatusBadgeClass(status: string): string {
  return toneClass((PAYMENT_STATUS_META[status] ?? FALLBACK).tone)
}
