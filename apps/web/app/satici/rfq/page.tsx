import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSellerProfile } from '@/lib/seller/guards'
import { createClient } from '@/lib/supabase/server'
import { SellerPendingScreen } from '@/components/seller/SellerPendingScreen'

export const metadata: Metadata = {
  title: 'Gelen Teklif Talepleri | İnşaat Borsam',
  robots: { index: false },
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  evaluating: 'Değerlendiriliyor',
  closed: 'Kapandı',
  expired: 'Süresi Doldu',
  cancelled: 'İptal Edildi',
}

function statusClass(status: string): string {
  if (status === 'open') return 'text-state-success border border-state-success'
  if (status === 'evaluating') return 'text-navy border border-navy'
  return 'text-ink-muted border border-border'
}

const UNIT_LABELS: Record<string, string> = {
  m2: 'm²', m3: 'm³', metre: 'Metre', ton: 'Ton', kg: 'Kg',
  adet: 'Adet', paket: 'Paket', kutu: 'Kutu', litre: 'Litre', cuval: 'Çuval',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function SaticiRfqListPage() {
  const { sellerProfile } = await requireSellerProfile('/satici/rfq')

  // Doğrulanmamış satıcı RFQ feed'ine erişemez — pending ekranı.
  if (!sellerProfile.isVerified) {
    return (
      <SellerPendingScreen storeName={sellerProfile.storeName} sectionLabel="Gelen Teklif Talepleri" />
    )
  }

  const supabase = await createClient()

  // RLS (rfqs_select_invited_seller) yalnızca davet edilen RFQ'leri döndürür.
  const { data: rfqs } = await supabase
    .from('rfqs')
    .select('id, title, status, quantity, unit, delivery_deadline, expires_at, offer_count, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  // Bu satıcının daha önce teklif verdiği RFQ'ler (RLS yalnızca kendi tekliflerini döndürür).
  const rfqIds = (rfqs ?? []).map((r) => r.id)
  const offeredRfqIds = new Set<string>()
  if (rfqIds.length > 0) {
    const { data: ownOffers } = await supabase
      .from('rfq_offers')
      .select('rfq_id')
      .eq('seller_id', sellerProfile.id)
      .in('rfq_id', rfqIds)
    for (const offer of ownOffers ?? []) offeredRfqIds.add(offer.rfq_id)
  }

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
                Gelen Teklif Talepleri
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/satici/teklifler"
                className="border border-border text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Tekliflerim
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
          {!rfqs || rfqs.length === 0 ? (
            <div className="border border-border bg-surface-container-lowest p-12 flex flex-col items-center gap-4 text-center max-w-xl">
              <p className="text-sm text-ink-secondary leading-6">
                Henüz size yönlendirilmiş bir teklif talebi yok. Alıcılar
                ihtiyaçlarına uygun satıcılara talep gönderdikçe talepler burada
                listelenecek.
              </p>
              <Link
                href="/satici/panel"
                className="border border-border text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:bg-surface-container transition-colors"
              >
                Panel’e Dön
              </Link>
            </div>
          ) : (
            <div className="border border-border bg-surface-container-lowest divide-y divide-border">
              {rfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  href={`/satici/rfq/${rfq.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-surface-container transition-colors group"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-bold text-ink group-hover:text-navy transition-colors truncate">
                      {rfq.title}
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-ink-muted tabular-nums">
                        {rfq.quantity} {UNIT_LABELS[rfq.unit] ?? rfq.unit}
                      </span>
                      <span className="text-xs text-ink-muted">
                        Teslimat: {formatDate(rfq.delivery_deadline)}
                      </span>
                      <span className="text-xs text-ink-muted">
                        Son geçerlilik: {formatDate(rfq.expires_at)}
                      </span>
                      <span className="text-xs text-ink-muted">{formatDate(rfq.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {offeredRfqIds.has(rfq.id) && (
                      <span className="text-xs font-bold text-state-success uppercase tracking-wider border border-state-success px-2 py-1">
                        Teklif Verildi
                      </span>
                    )}
                    {rfq.offer_count > 0 && (
                      <span className="text-xs text-ink-muted tabular-nums">
                        {rfq.offer_count} teklif
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${statusClass(rfq.status)}`}
                    >
                      {STATUS_LABELS[rfq.status] ?? rfq.status}
                    </span>
                    <span className="text-ink-muted text-sm">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
