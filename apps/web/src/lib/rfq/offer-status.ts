// apps/web/src/lib/rfq/offer-status.ts
// rfq_offers.status için merkezi label/açıklama/rozet eşlemesi.
//
// DB CHECK (migration 20260519000028 + 20260531000001): status IN
//   ('pending', 'shortlisted', 'accepted', 'accepted_pending_order',
//    'rejected', 'expired', 'withdrawn')
// Sprint 6.1: shortlisted + accepted_pending_order eklendi (alıcı lifecycle aksiyonları
// set_rfq_offer_status RPC ile yazılır). 'accepted' legacy/uyum için tutulur.
//
// Bilinmeyen/uyumsuz status → güvenli fallback ("Bilinmeyen Durum").

export const OFFER_STATUS_VALUES = [
  'pending',
  'shortlisted',
  'accepted',
  'accepted_pending_order',
  'rejected',
  'expired',
  'withdrawn',
] as const

export type OfferStatus = (typeof OFFER_STATUS_VALUES)[number]

type StatusTone = 'neutral' | 'success' | 'danger' | 'muted'

type OfferStatusMeta = {
  /** Alıcı tarafı kısa etiket (rozet). */
  label: string
  /** Satıcı tarafı 1. tekil mesaj. */
  sellerLabel: string
  /** Satıcıya gösterilen açıklama satırı. */
  sellerDescription: string
  tone: StatusTone
}

const OFFER_STATUS_META: Record<OfferStatus, OfferStatusMeta> = {
  pending: {
    label: 'Beklemede',
    sellerLabel: 'Teklifiniz gönderildi',
    sellerDescription: 'Teklifiniz alıcı tarafından değerlendiriliyor.',
    tone: 'neutral',
  },
  shortlisted: {
    label: 'Kısa Listede',
    sellerLabel: 'Teklifiniz kısa listeye alındı',
    sellerDescription: 'Alıcı teklifinizi kısa listeye aldı; değerlendirme sürüyor.',
    tone: 'neutral',
  },
  accepted: {
    label: 'Seçildi',
    sellerLabel: 'Teklifiniz seçildi',
    sellerDescription: 'Alıcı teklifinizi seçti. Sipariş aşaması yakında açılacak.',
    tone: 'success',
  },
  accepted_pending_order: {
    label: 'Seçildi',
    sellerLabel: 'Teklifiniz seçildi, sipariş aşaması bekleniyor',
    sellerDescription: 'Alıcı teklifinizi seçti. Sipariş aşaması yakında açılacak.',
    tone: 'success',
  },
  rejected: {
    label: 'Reddedildi',
    sellerLabel: 'Teklifiniz reddedildi',
    sellerDescription: 'Alıcı bu talep için başka bir teklifi değerlendirdi.',
    tone: 'danger',
  },
  expired: {
    label: 'Süresi Doldu',
    sellerLabel: 'Teklifin süresi doldu',
    sellerDescription: 'Talebin geçerlilik süresi dolduğu için teklif pasif.',
    tone: 'muted',
  },
  withdrawn: {
    label: 'Geri Çekildi',
    sellerLabel: 'Teklifinizi geri çektiniz',
    sellerDescription: 'Bu teklif geri çekildi.',
    tone: 'muted',
  },
}

const FALLBACK_META: OfferStatusMeta = {
  label: 'Bilinmeyen Durum',
  sellerLabel: 'Durum bilinmiyor',
  sellerDescription: 'Teklif durumu okunamadı.',
  tone: 'muted',
}

export function getOfferStatusMeta(status: string): OfferStatusMeta {
  return OFFER_STATUS_META[status as OfferStatus] ?? FALLBACK_META
}

export function offerStatusLabel(status: string): string {
  return getOfferStatusMeta(status).label
}

export function offerStatusSellerLabel(status: string): string {
  return getOfferStatusMeta(status).sellerLabel
}

export function offerStatusSellerDescription(status: string): string {
  return getOfferStatusMeta(status).sellerDescription
}

/** Token-bazlı rozet sınıfı (hex yok). */
export function offerStatusBadgeClass(status: string): string {
  switch (getOfferStatusMeta(status).tone) {
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

/**
 * Bir teklifin "aktif" sayılıp karşılaştırmaya (en uygun/en hızlı) dahil edilip
 * edilmeyeceği. Reddedilen/çekilen/süresi dolan teklifler karşılaştırma dışı.
 */
export function isComparableOfferStatus(status: string): boolean {
  return (
    status === 'pending' ||
    status === 'shortlisted' ||
    status === 'accepted' ||
    status === 'accepted_pending_order'
  )
}
