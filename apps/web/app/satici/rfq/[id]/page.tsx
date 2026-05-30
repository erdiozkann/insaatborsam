import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireSellerProfile } from '@/lib/seller/guards'
import { createClient } from '@/lib/supabase/server'
import { SellerPendingScreen } from '@/components/seller/SellerPendingScreen'
import { OfferForm } from './OfferForm'

export const metadata: Metadata = {
  title: 'Teklif Talebi | İnşaat Borsam',
  robots: { index: false },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STATUS_LABELS: Record<string, string> = {
  open: 'Açık',
  evaluating: 'Değerlendiriliyor',
  closed: 'Kapandı',
  expired: 'Süresi Doldu',
  cancelled: 'İptal Edildi',
}

const OFFER_STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  expired: 'Süresi Doldu',
  withdrawn: 'Geri Çekildi',
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
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

type Props = { params: Promise<{ id: string }> }

export default async function SaticiRfqDetailPage({ params }: Props) {
  const { id } = await params
  const { sellerProfile } = await requireSellerProfile(`/satici/rfq/${id}`)

  if (!sellerProfile.isVerified) {
    return (
      <SellerPendingScreen storeName={sellerProfile.storeName} sectionLabel="Teklif Talebi" />
    )
  }

  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()

  // RLS yalnızca davetli satıcıya bu RFQ'yi döndürür. Erişim yoksa null → notFound.
  // estimated_budget_cents bilinçli olarak SELECT edilmez — satıcıya gösterilmez.
  const { data: rfq } = await supabase
    .from('rfqs')
    .select('id, title, description, status, quantity, unit, delivery_deadline, expires_at, brand_preference, created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!rfq) notFound()

  // Kalemler — estimated_unit_price_cents satıcıya gösterilmez (alıcı beklenti fiyatı).
  const { data: items } = await supabase
    .from('rfq_items')
    .select('id, material_name, brand_preference, quantity, unit, notes, display_order')
    .eq('rfq_id', rfq.id)
    .order('display_order')

  // Bu satıcının bu RFQ'ya verdiği teklif (RLS yalnızca kendi teklifini döndürür).
  const { data: ownOffer } = await supabase
    .from('rfq_offers')
    .select('id, unit_price_cents, total_price_cents, delivery_time_days, notes, status, created_at')
    .eq('rfq_id', rfq.id)
    .eq('seller_id', sellerProfile.id)
    .maybeSingle()

  const canOffer = rfq.status === 'open' && !ownOffer

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
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 ${statusClass(rfq.status)}`}>
                  {STATUS_LABELS[rfq.status] ?? rfq.status}
                </span>
                <span className="text-xs text-ink-muted">{formatDate(rfq.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/satici/rfq"
                className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                ← Talepler
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">

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
                  {rfq.brand_preference && (
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">Marka Tercihi</span>
                      <span className="text-sm text-ink font-medium text-right">{rfq.brand_preference}</span>
                    </div>
                  )}
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">Teslimat Tarihi</span>
                    <span className="text-sm text-ink font-medium text-right">{formatDate(rfq.delivery_deadline)}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">Son Geçerlilik</span>
                    <span className="text-sm text-ink font-medium text-right">{formatDate(rfq.expires_at)}</span>
                  </div>
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
                        {item.brand_preference && (
                          <span className="text-xs text-ink-muted">Marka: {item.brand_preference}</span>
                        )}
                        {item.notes && (
                          <span className="text-xs text-ink-muted leading-5">{item.notes}</span>
                        )}
                        <span className="text-xs text-ink-muted">Kalem {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ panel — teklif durumu / form */}
            <aside className="flex flex-col gap-4">
              {ownOffer ? (
                <div className="border border-state-success bg-surface-container-lowest">
                  <div className="bg-surface-container px-5 py-3 border-b border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Verdiğiniz Teklif</h3>
                  </div>
                  <div className="divide-y divide-border">
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider">Durum</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-state-success">
                        {OFFER_STATUS_LABELS[ownOffer.status] ?? ownOffer.status}
                      </span>
                    </div>
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider">Birim Fiyat</span>
                      <span className="text-sm font-bold text-ink tabular-nums">{formatCents(ownOffer.unit_price_cents)}</span>
                    </div>
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider">Toplam</span>
                      <span className="text-sm font-bold text-ink tabular-nums">{formatCents(ownOffer.total_price_cents)}</span>
                    </div>
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider">Teslimat</span>
                      <span className="text-sm font-medium text-ink tabular-nums">{ownOffer.delivery_time_days} gün</span>
                    </div>
                    {ownOffer.notes && (
                      <div className="px-5 py-4">
                        <span className="text-xs text-ink-muted uppercase tracking-wider block mb-1">Notunuz</span>
                        <p className="text-sm text-ink leading-5 whitespace-pre-wrap">{ownOffer.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-5 border-t border-border">
                    <Link href="/satici/teklifler" className="text-xs text-navy underline font-medium">
                      Tüm tekliflerime git
                    </Link>
                  </div>
                </div>
              ) : canOffer ? (
                <div className="border border-border bg-surface-container-lowest">
                  <div className="bg-surface-container px-5 py-3 border-b border-border">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Teklif Ver</h3>
                  </div>
                  <div className="p-5">
                    <OfferForm
                      rfqId={rfq.id}
                      quantity={rfq.quantity}
                      unitLabel={UNIT_LABELS[rfq.unit] ?? rfq.unit}
                    />
                  </div>
                </div>
              ) : (
                <div className="border border-border bg-surface-container-lowest p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-2">Teklif Verilemez</h3>
                  <p className="text-sm text-ink-secondary leading-6">
                    Bu talep şu anda tekliflere açık değil (durum:{' '}
                    {STATUS_LABELS[rfq.status] ?? rfq.status}).
                  </p>
                </div>
              )}

              <div className="border border-border bg-surface-container-lowest p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">Hızlı Erişim</h3>
                <nav className="flex flex-col gap-2">
                  <Link href="/satici/rfq" className="text-sm font-bold text-navy hover:opacity-80 transition-opacity">
                    Gelen Teklif Talepleri
                  </Link>
                  <Link href="/satici/teklifler" className="text-sm text-ink-secondary hover:text-ink transition-colors">
                    Tekliflerim
                  </Link>
                  <Link href="/satici/panel" className="text-sm text-ink-secondary hover:text-ink transition-colors">
                    Satıcı Paneli
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
