import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSellerProfile } from '@/lib/seller/guards'
import { createClient } from '@/lib/supabase/server'
import { SellerPendingScreen } from '@/components/seller/SellerPendingScreen'
import {
  offerStatusLabel,
  offerStatusBadgeClass,
  offerStatusSellerDescription,
} from '@/lib/rfq/offer-status'

export const metadata: Metadata = {
  title: 'Tekliflerim | İnşaat Borsam',
  robots: { index: false },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function SaticiTekliflerPage() {
  const { sellerProfile } = await requireSellerProfile('/satici/teklifler')

  if (!sellerProfile.isVerified) {
    return <SellerPendingScreen storeName={sellerProfile.storeName} sectionLabel="Tekliflerim" />
  }

  const supabase = await createClient()

  // RLS (rfq_offers_select_own_seller) yalnızca bu satıcının tekliflerini döndürür.
  // RFQ başlığı embedded select ile alınır (rfqs RLS davetli satıcıya erişim verir).
  const { data: offers } = await supabase
    .from('rfq_offers')
    .select('id, rfq_id, unit_price_cents, total_price_cents, delivery_time_days, status, created_at, resulting_order_id, rfqs(title)')
    .eq('seller_id', sellerProfile.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Satıcı Paneli
              </span>
              <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
                Tekliflerim
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/satici/rfq"
                className="border border-border text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Gelen Talepler
              </Link>
              <Link
                href="/satici/panel"
                className="border border-border text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Panel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          {!offers || offers.length === 0 ? (
            <div className="border border-border bg-surface-container-lowest p-12 flex flex-col items-center gap-4 text-center max-w-xl">
              <p className="text-sm text-ink-secondary leading-6">
                Henüz teklif vermediniz. Size yönlendirilen teklif taleplerini
                inceleyip teklif vererek başlayın.
              </p>
              <Link
                href="/satici/rfq"
                className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:opacity-90 transition-opacity"
              >
                Gelen Talepleri Gör →
              </Link>
            </div>
          ) : (
            <div className="border border-border bg-surface-container-lowest divide-y divide-border">
              {offers.map((offer) => (
                <div key={offer.id}>
                  <Link
                    href={`/satici/rfq/${offer.rfq_id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-surface-container transition-colors group"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-bold text-ink group-hover:text-navy transition-colors truncate">
                        {offer.rfqs?.title ?? 'Teklif Talebi'}
                      </span>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-ink-muted tabular-nums">
                          Birim: {formatCents(offer.unit_price_cents)}
                        </span>
                        <span className="text-xs text-ink-muted tabular-nums">
                          Teslimat: {offer.delivery_time_days} gün
                        </span>
                        <span className="text-xs text-ink-muted">{formatDate(offer.created_at)}</span>
                      </div>
                      <span className="text-xs text-ink-secondary leading-5">
                        {offerStatusSellerDescription(offer.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-bold text-ink tabular-nums">
                        {formatCents(offer.total_price_cents)}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${offerStatusBadgeClass(offer.status)}`}
                      >
                        {offerStatusLabel(offer.status)}
                      </span>
                      <span className="text-ink-muted text-sm">→</span>
                    </div>
                  </Link>
                  {offer.resulting_order_id && (
                    <Link
                      href={`/satici/siparis/${offer.resulting_order_id}`}
                      className="flex items-center gap-2 px-5 py-2 border-t border-border bg-surface-container text-xs font-bold uppercase tracking-wider text-navy hover:opacity-80 transition-opacity"
                    >
                      Siparişi Görüntüle →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
