import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireBuyer } from '@/lib/rfq/guards'
import { createClient } from '@/lib/supabase/server'
import { isComparableOfferStatus } from '@/lib/rfq/offer-status'
import { OfferComparisonCard, type OfferCardData } from './OfferComparisonCard'

export const metadata: Metadata = {
  title: 'Teklif Talebi | İnşaat Borsam',
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
  if (status === 'open') return 'bg-state-success text-white'
  if (status === 'evaluating') return 'bg-navy text-white'
  return 'bg-surface-container text-ink-muted'
}

const UNIT_LABELS: Record<string, string> = {
  m2: 'm²', m3: 'm³', metre: 'Metre', ton: 'Ton', kg: 'Kg',
  adet: 'Adet', paket: 'Paket', kutu: 'Kutu', litre: 'Litre', cuval: 'Çuval',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(cents / 100)
}

type Props = { params: Promise<{ id: string }> }

export default async function RfqDetailPage({ params }: Props) {
  const { id } = await params
  const { buyerProfileId } = await requireBuyer(`/alici/rfq/${id}`)

  const supabase = await createClient()

  const { data: rfq } = await supabase
    .from('rfqs')
    .select(
      'id, title, description, status, quantity, unit, delivery_deadline, expires_at, offer_count, sent_to_count, viewed_count, estimated_budget_cents, created_at',
    )
    .eq('id', id)
    .eq('buyer_id', buyerProfileId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!rfq) notFound()

  const { data: items } = await supabase
    .from('rfq_items')
    .select('id, material_name, quantity, unit, notes, display_order, estimated_unit_price_cents')
    .eq('rfq_id', rfq.id)
    .order('display_order')

  // Gelen teklifler (RLS: rfq_offers_select_buyer — sadece bu alıcının RFQ'larına gelenler).
  // estimated_unit_price_cents gibi alıcı beklenti verileri burada değil; teklif gerçek fiyatları.
  const { data: offersRaw } = await supabase
    .from('rfq_offers')
    .select(
      'id, unit_price_cents, total_price_cents, delivery_time_days, notes, status, created_at, seller_profiles(store_name, company_name, primary_city, rating_avg, rating_count)',
    )
    .eq('rfq_id', rfq.id)
    .order('total_price_cents', { ascending: true })

  const offers = offersRaw ?? []
  const comparable = offers.filter((o) => isComparableOfferStatus(o.status))
  const minTotal = comparable.length > 0 ? Math.min(...comparable.map((o) => o.total_price_cents)) : null
  const minDays = comparable.length > 0 ? Math.min(...comparable.map((o) => o.delivery_time_days)) : null

  const offerCards: OfferCardData[] = offers.map((o) => {
    const seller = o.seller_profiles
    const comparableOffer = isComparableOfferStatus(o.status)
    return {
      id: o.id,
      sellerName: seller?.store_name ?? seller?.company_name ?? 'Satıcı',
      sellerCity: seller?.primary_city ?? null,
      ratingAvg: seller?.rating_avg ?? null,
      ratingCount: seller?.rating_count ?? null,
      unitPriceCents: o.unit_price_cents,
      totalPriceCents: o.total_price_cents,
      deliveryTimeDays: o.delivery_time_days,
      notes: o.notes,
      status: o.status,
      createdAt: o.created_at,
      isCheapest: comparableOffer && minTotal !== null && o.total_price_cents === minTotal,
      isFastest: comparableOffer && minDays !== null && o.delivery_time_days === minDays,
    }
  })

  const isActive = rfq.status === 'open' || rfq.status === 'evaluating'

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Teklif Talebi
              </span>
              <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
                {rfq.title}
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${statusClass(rfq.status)}`}
                >
                  {STATUS_LABELS[rfq.status] ?? rfq.status}
                </span>
                <span className="text-xs text-ink-muted">
                  {formatDate(rfq.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/alici/rfq"
                className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                ← Taleplerim
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Durum kartı */}
              {isActive && (
                <div className="border border-state-success bg-surface-container-lowest p-5 flex items-center gap-4">
                  <span className="text-state-success font-bold text-lg leading-none flex-shrink-0">✓</span>
                  <p className="text-sm text-ink leading-5">
                    Talebiniz aktif. Satıcılar davet edildikçe teklif gönderecek.
                  </p>
                </div>
              )}

              {/* Talep Detayları */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Talep Detayları</h2>
                </div>
                <div className="divide-y divide-border">
                  <div className="px-5 py-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider block mb-2">Açıklama</span>
                    <p className="text-sm text-ink leading-6 whitespace-pre-wrap">{rfq.description}</p>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">Ana Miktar</span>
                    <span className="text-sm text-ink font-bold tabular-nums text-right">
                      {rfq.quantity} {UNIT_LABELS[rfq.unit] ?? rfq.unit}
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">Teslimat Tarihi</span>
                    <span className="text-sm text-ink font-medium text-right">{formatDate(rfq.delivery_deadline)}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">Geçerlilik Tarihi</span>
                    <span className="text-sm text-ink font-medium text-right">{formatDate(rfq.expires_at)}</span>
                  </div>
                  {rfq.estimated_budget_cents && (
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">Tahmini Bütçe</span>
                      <span className="text-sm text-ink font-bold tabular-nums text-right">
                        {formatCents(rfq.estimated_budget_cents)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Malzeme Kalemleri */}
              {items && items.length > 0 && (
                <div className="border border-border bg-surface-container-lowest">
                  <div className="p-5 border-b border-border">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                      Malzeme Kalemleri ({items.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((item, idx) => (
                      <div key={item.id} className="px-5 py-4 flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-sm font-bold text-ink">{item.material_name}</span>
                          <span className="text-sm text-ink font-medium tabular-nums text-right flex-shrink-0">
                            {item.quantity} {UNIT_LABELS[item.unit] ?? item.unit}
                          </span>
                        </div>
                        {item.notes && (
                          <span className="text-xs text-ink-muted leading-5">{item.notes}</span>
                        )}
                        {item.estimated_unit_price_cents && (
                          <span className="text-xs text-ink-muted tabular-nums">
                            Tahmini birim: {formatCents(item.estimated_unit_price_cents)}
                          </span>
                        )}
                        <span className="text-xs text-ink-muted">Kalem {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gelen Teklifler */}
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                    Gelen Teklifler ({offers.length})
                  </h2>
                </div>

                {offers.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-ink-secondary leading-6">
                      Bu talebe henüz teklif gelmedi. Davet edilen satıcılar teklif
                      gönderdikçe burada listelenecek.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 flex flex-col gap-4">
                    <div className="border border-border bg-surface-container px-4 py-3">
                      <p className="text-xs text-ink-secondary leading-5">
                        Teklifleri karşılaştırıp kısa listeye alabilir, reddedebilir veya
                        seçebilirsiniz.{' '}
                        <strong className="text-ink">Sipariş oluşturma Sprint 7&apos;de açılacak.</strong>
                      </p>
                    </div>
                    {offerCards.map((offer) => (
                      <OfferComparisonCard key={offer.id} offer={offer} rfqId={rfq.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sağ panel */}
            <aside className="flex flex-col gap-4">
              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Talep Özeti</h3>
                </div>
                <div className="divide-y divide-border">
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">Durum</span>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${statusClass(rfq.status)}`}>
                      {STATUS_LABELS[rfq.status] ?? rfq.status}
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">Gelen Teklif</span>
                    <span className="text-sm font-bold text-ink tabular-nums">{rfq.offer_count}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">Davet Edilen</span>
                    <span className="text-sm font-bold text-ink tabular-nums">{rfq.sent_to_count}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider">Görüntüleyen</span>
                    <span className="text-sm font-bold text-ink tabular-nums">{rfq.viewed_count}</span>
                  </div>
                </div>
                <div className="p-5 border-t border-border">
                  <Link
                    href="/alici/rfq"
                    className="text-xs text-navy underline font-medium"
                  >
                    Tüm taleplerime dön
                  </Link>
                </div>
              </div>

              <div className="border border-border bg-surface-container-lowest p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">Hızlı Erişim</h3>
                <nav className="flex flex-col gap-2">
                  <Link href="/alici/rfq/yeni" className="text-sm font-bold text-navy hover:opacity-80 transition-opacity">
                    Yeni Teklif Talebi
                  </Link>
                  <Link href="/alici/panel" className="text-sm text-ink-secondary hover:text-ink transition-colors">
                    Alıcı Paneli
                  </Link>
                  <Link href="/iletisim" className="text-sm text-ink-secondary hover:text-ink transition-colors">
                    Destek
                  </Link>
                </nav>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
