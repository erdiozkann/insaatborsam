// apps/web/app/alici/rfq/[id]/OfferComparisonCard.tsx
// Alıcının gelen teklifleri sade ve karşılaştırılabilir gördüğü kart.
// SALT-OKUMA (Sprint 6): aksiyon butonları DISABLED — gerçek shortlist/reject/accept
// Sprint 6.1'de (migration + RPC) açılacak. Hiçbir şey "çalışıyor gibi" gösterilmez.
//
// Server component — interaktivite yok (disabled butonlar client JS gerektirmez).

import Link from 'next/link'
import { offerStatusLabel, offerStatusBadgeClass } from '@/lib/rfq/offer-status'
import {
  shortlistOfferAction,
  rejectOfferAction,
  acceptOfferPendingAction,
  createOrderFromOfferAction,
} from './actions'

export type OfferCardData = {
  id: string
  sellerName: string
  sellerCity: string | null
  ratingAvg: number | null
  ratingCount: number | null
  unitPriceCents: number
  totalPriceCents: number
  deliveryTimeDays: number
  notes: string | null
  status: string
  createdAt: string
  resultingOrderId: string | null
  isCheapest: boolean
  isFastest: boolean
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function OfferComparisonCard({
  offer,
  rfqId,
}: {
  offer: OfferCardData
  rfqId: string
}) {
  // Seçilmiş teklif: accepted_pending_order = yeni akış; accepted = legacy uyum.
  const isSelected = offer.status === 'accepted_pending_order' || offer.status === 'accepted'
  // Sipariş oluşturma YALNIZCA accepted_pending_order'da (RPC de bu durumu zorunlu kılar).
  // Legacy 'accepted' tekliflerde buton gösterilmez — aksi halde no-op buton oluşurdu.
  const canCreateOrder = offer.status === 'accepted_pending_order'
  // Pasif teklif (satıcı çekti / süresi doldu): alıcı işlem yapamaz.
  const isInactive = offer.status === 'withdrawn' || offer.status === 'expired'

  return (
    <div className="border border-border bg-surface-container-lowest">
      {/* Başlık: satıcı + durum */}
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink truncate">{offer.sellerName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {offer.sellerCity && (
              <span className="text-xs text-ink-muted">{offer.sellerCity}</span>
            )}
            {offer.ratingCount != null && offer.ratingCount > 0 && offer.ratingAvg != null && (
              <span className="text-xs text-ink-muted tabular-nums">
                ★ {offer.ratingAvg.toFixed(1)} ({offer.ratingCount})
              </span>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-bold uppercase tracking-wider px-2 py-1 flex-shrink-0 ${offerStatusBadgeClass(offer.status)}`}
        >
          {offerStatusLabel(offer.status)}
        </span>
      </div>

      {/* Rozetler (yalnızca güvenli hesaplanan) */}
      {(offer.isCheapest || offer.isFastest) && (
        <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
          {offer.isCheapest && (
            <span className="text-xs font-bold uppercase tracking-wider bg-state-success text-white px-2 py-1">
              En Uygun Fiyat
            </span>
          )}
          {offer.isFastest && (
            <span className="text-xs font-bold uppercase tracking-wider bg-navy text-white px-2 py-1">
              En Hızlı Teslimat
            </span>
          )}
        </div>
      )}

      {/* Değerler */}
      <div className="px-5 py-4 grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Toplam</span>
          <span className="text-sm font-bold text-ink tabular-nums">{formatCents(offer.totalPriceCents)}</span>
        </div>
        <div>
          <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Birim Fiyat</span>
          <span className="text-sm font-medium text-ink tabular-nums">{formatCents(offer.unitPriceCents)}</span>
        </div>
        <div>
          <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Teslimat</span>
          <span className="text-sm font-medium text-ink tabular-nums">{offer.deliveryTimeDays} gün</span>
        </div>
        <div>
          <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Tarih</span>
          <span className="text-sm font-medium text-ink">{formatDate(offer.createdAt)}</span>
        </div>
      </div>

      {offer.notes && (
        <div className="px-5 pb-4">
          <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Satıcı Notu</span>
          <p className="text-sm text-ink leading-5 whitespace-pre-wrap">{offer.notes}</p>
        </div>
      )}

      {/* Aksiyonlar — alıcı lifecycle. Güvenlik server tarafında (RPC, SECURITY DEFINER). */}
      {isSelected ? (
        <div className="px-5 py-4 border-t border-border bg-surface-container flex flex-col gap-3">
          {offer.resultingOrderId ? (
            <>
              <p className="text-xs text-ink-secondary leading-5">
                Bu tekliften sipariş oluşturuldu.
              </p>
              <Link
                href={`/alici/siparis/${offer.resultingOrderId}`}
                className="inline-block self-start bg-navy text-white font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                Siparişi Görüntüle
              </Link>
            </>
          ) : canCreateOrder ? (
            <>
              <p className="text-xs text-ink-secondary leading-5">
                Bu teklifi seçtiniz. Bu tekliften sipariş oluşturabilirsiniz.{' '}
                <strong className="text-ink">Sipariş oluşturmak ödeme değildir.</strong>
              </p>
              <form action={createOrderFromOfferAction.bind(null, offer.id, rfqId)}>
                <button
                  type="submit"
                  className="bg-brand text-navy font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:opacity-90 transition-opacity"
                >
                  Sipariş Oluştur
                </button>
              </form>
            </>
          ) : (
            <p className="text-xs text-ink-secondary leading-5">Bu teklifi seçtiniz.</p>
          )}
        </div>
      ) : isInactive ? (
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-ink-muted leading-5">Bu teklif için işlem yapılamaz.</p>
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-border flex items-center gap-2 flex-wrap">
          {offer.status !== 'shortlisted' && (
            <form action={shortlistOfferAction.bind(null, offer.id, rfqId)}>
              <button
                type="submit"
                className="border border-border text-navy font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:bg-surface-container transition-colors"
              >
                Kısa Liste
              </button>
            </form>
          )}
          {offer.status !== 'rejected' && (
            <form action={rejectOfferAction.bind(null, offer.id, rfqId)}>
              <button
                type="submit"
                className="border border-state-error text-state-error font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:bg-surface-container transition-colors"
              >
                Reddet
              </button>
            </form>
          )}
          <form action={acceptOfferPendingAction.bind(null, offer.id, rfqId)}>
            <button
              type="submit"
              className="bg-brand text-navy font-bold text-xs uppercase tracking-wider px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              Seç
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
