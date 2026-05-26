import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Satıcı Paneli | İnşaat Borsam',
  robots: { index: false },
}

export default async function SaticiPanelPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/giris?redirect=/satici/panel')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'seller') redirect('/profil')

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('id, store_name, is_verified, subscription_tier, primary_city')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sellerProfile) redirect('/satici/onboarding')

  // Doğrulama bekleniyorsa panel açılmaz — durum ekranı gösterilir
  if (!sellerProfile.is_verified) {
    return (
      <>
        <section className="bg-surface border-b border-border py-10">
          <div className="w-full max-w-container mx-auto px-5 md:px-12">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
              Satıcı Paneli
            </span>
            <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
              {sellerProfile.store_name}
            </h1>
          </div>
        </section>

        <section className="bg-surface py-16">
          <div className="w-full max-w-container mx-auto px-5 md:px-12">
            <div className="max-w-xl mx-auto border border-state-warning bg-surface-container-lowest">
              <div className="bg-surface-container px-6 py-4 border-b border-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Doğrulama Bekleniyor
                </h2>
              </div>
              <div className="p-8 flex flex-col gap-4">
                <p className="text-sm text-ink leading-6">
                  Mağaza profiliniz oluşturuldu:{' '}
                  <strong>{sellerProfile.store_name}</strong>. Satış yapabilmek
                  için ekibimiz tarafından doğrulanması gerekiyor.
                </p>
                <p className="text-sm text-ink-secondary leading-6">
                  Başvurunuz inceleniyor. 24 iş saati içinde e-posta ve SMS ile
                  bilgilendireceğiz.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href="/profil"
                    className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:opacity-90 transition-opacity"
                  >
                    Profilime Dön
                  </Link>
                  <Link
                    href="/iletisim"
                    className="border border-border text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:bg-surface-container transition-colors"
                  >
                    İletişim
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    )
  }

  // Doğrulanmış satıcı — panel shell
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

          {/* Placeholder kartlar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Gelen Teklif Talepleri */}
            <div className="border border-border bg-surface-container-lowest">
              <div className="bg-surface-container px-5 py-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Gelen Teklif Talepleri
                </h3>
              </div>
              <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-3">
                <p className="text-sm text-ink-muted text-center leading-6">
                  Alıcılardan gelen teklif talepleri burada listelenecek.
                </p>
                <span className="text-xs font-bold uppercase tracking-wider border border-border text-ink-muted px-3 py-1">
                  Yakında
                </span>
              </div>
            </div>

            {/* Tekliflerim */}
            <div className="border border-border bg-surface-container-lowest">
              <div className="bg-surface-container px-5 py-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Tekliflerim
                </h3>
              </div>
              <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-3">
                <p className="text-sm text-ink-muted text-center leading-6">
                  Gönderdiğiniz tekliflerin durumunu buradan takip edeceksiniz.
                </p>
                <span className="text-xs font-bold uppercase tracking-wider border border-border text-ink-muted px-3 py-1">
                  Yakında
                </span>
              </div>
            </div>

            {/* Üyelik & KYC */}
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
                  <Link
                    href="/fiyatlar"
                    className="text-xs text-navy underline font-medium"
                  >
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
