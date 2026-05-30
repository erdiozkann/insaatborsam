import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { SellerPendingScreen } from '@/components/seller/SellerPendingScreen'

export const metadata: Metadata = {
  title: 'Satıcı Paneli | İnşaat Borsam',
  robots: { index: false },
}

const RFQ_STATUS_LABELS: Record<string, string> = {
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

function formatCents(cents: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

export default async function SaticiPanelPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/giris?redirect=/satici/panel')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'seller') redirect('/profil')

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('id, store_name, is_verified, subscription_tier, primary_city')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sellerProfile) redirect('/satici/onboarding')

  // Doğrulama bekleniyorsa panel açılmaz — pending ekranı gösterilir.
  if (!sellerProfile.is_verified) {
    return <SellerPendingScreen storeName={sellerProfile.store_name} sectionLabel="Satıcı Paneli" />
  }

  // Doğrulanmış satıcı — mini feed'ler (yalnızca RLS'in izin verdiği veriler).
  const { data: recentRfqs } = await supabase
    .from('rfqs')
    .select('id, title, status, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(4)

  const { data: recentOffers } = await supabase
    .from('rfq_offers')
    .select('id, rfq_id, status, total_price_cents, created_at, rfqs(title)')
    .eq('seller_id', sellerProfile.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const tierLabel =
    sellerProfile.subscription_tier === 'pro'
      ? 'Pro'
      : sellerProfile.subscription_tier === 'enterprise'
        ? 'Enterprise'
        : sellerProfile.subscription_tier === 'basic'
          ? 'Başlangıç'
          : 'Plan Seçilmedi'

  return (
    <>
      {/* Sayfa başlığı */}
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Satıcı Paneli
              </span>
              <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
                {sellerProfile.store_name}
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-navy text-white px-2 py-1">
                  Satıcı
                </span>
                <span className="text-xs font-bold text-state-success uppercase tracking-wider border border-state-success px-2 py-1">
                  ✓ Doğrulandı
                </span>
                {sellerProfile.subscription_tier && (
                  <span className="text-xs font-bold uppercase tracking-wider border border-border text-ink-secondary px-2 py-1">
                    {tierLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/satici/rfq"
                className="bg-brand text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:opacity-90 transition-opacity"
              >
                Gelen Talepler
              </Link>
              <Link
                href="/profil"
                className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Profilim
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* İçerik */}
      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">

          {/* Mağaza durumu kartı */}
          <div className="border border-border bg-surface-container-lowest p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Mağaza Durumu
                </p>
                <p className="text-sm font-bold text-ink">{sellerProfile.store_name}</p>
                {sellerProfile.primary_city && (
                  <p className="text-xs text-ink-muted mt-0.5">{sellerProfile.primary_city}</p>
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider bg-state-success text-white px-3 py-1 self-start sm:self-auto">
                Aktif
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Gelen Teklif Talepleri — mini feed */}
            <div className="border border-border bg-surface-container-lowest flex flex-col">
              <div className="bg-surface-container px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Gelen Teklif Talepleri
                </h3>
                <Link href="/satici/rfq" className="text-xs text-navy underline font-medium">
                  Tümü
                </Link>
              </div>
              <div className="flex-1 flex flex-col">
                {!recentRfqs || recentRfqs.length === 0 ? (
                  <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-3">
                    <p className="text-sm text-ink-muted text-center leading-6">
                      Henüz size yönlendirilmiş talep yok.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentRfqs.map((rfq) => (
                      <Link
                        key={rfq.id}
                        href={`/satici/rfq/${rfq.id}`}
                        className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-surface-container transition-colors"
                      >
                        <span className="text-sm text-ink truncate">{rfq.title}</span>
                        <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">
                          {RFQ_STATUS_LABELS[rfq.status] ?? rfq.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tekliflerim — mini feed */}
            <div className="border border-border bg-surface-container-lowest flex flex-col">
              <div className="bg-surface-container px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Tekliflerim
                </h3>
                <Link href="/satici/teklifler" className="text-xs text-navy underline font-medium">
                  Tümü
                </Link>
              </div>
              <div className="flex-1 flex flex-col">
                {!recentOffers || recentOffers.length === 0 ? (
                  <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-3">
                    <p className="text-sm text-ink-muted text-center leading-6">
                      Henüz teklif vermediniz.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentOffers.map((offer) => (
                      <Link
                        key={offer.id}
                        href={`/satici/rfq/${offer.rfq_id}`}
                        className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-surface-container transition-colors"
                      >
                        <span className="text-sm text-ink truncate">
                          {offer.rfqs?.title ?? 'Teklif Talebi'}
                        </span>
                        <span className="text-xs font-bold text-ink tabular-nums flex-shrink-0">
                          {formatCents(offer.total_price_cents)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Üyelik Durumu */}
            <div className="border border-border bg-surface-container-lowest">
              <div className="bg-surface-container px-5 py-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Üyelik Durumu
                </h3>
              </div>
              <div className="p-6 flex flex-col gap-3 min-h-[140px]">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink-muted uppercase tracking-wider">Plan</span>
                  <span className="text-sm font-bold text-ink tabular-nums">{tierLabel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink-muted uppercase tracking-wider">Doğrulama</span>
                  <span className="text-xs font-bold text-state-success uppercase tracking-wider">
                    ✓ Tamamlandı
                  </span>
                </div>
                <div className="pt-2 border-t border-border">
                  <Link href="/fiyatlar" className="text-xs text-navy underline font-medium">
                    Planları karşılaştır
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Alt bilgi */}
          <div className="mt-10 border-t border-border pt-8">
            <p className="text-xs text-ink-muted leading-5">
              Ürün yönetimi, sipariş takibi ve analiz özellikleri yakında aktif olacak.
              Sorularınız için{' '}
              <Link href="/iletisim" className="underline text-navy">
                iletişime geçin
              </Link>
              .
            </p>
          </div>

        </div>
      </section>
    </>
  )
}
