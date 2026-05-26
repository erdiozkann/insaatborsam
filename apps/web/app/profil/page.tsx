import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { SignOutButton } from './SignOutButton'

export const metadata: Metadata = {
  title: 'Profilim | İnşaat Borsam',
  robots: { index: false },
}

export default async function ProfilPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/giris?redirect=/profil')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return (
      <section className="min-h-[80vh] bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-ink-secondary mb-4">Profil bilgisi yüklenemedi.</p>
          <Link href="/giris" className="text-sm text-navy underline">
            Yeniden giriş yap
          </Link>
        </div>
      </section>
    )
  }

  let buyerProfile: {
    id: string
    company_name: string | null
    subscription_tier: string
  } | null = null

  let sellerProfile: {
    id: string
    store_name: string
    is_verified: boolean
    subscription_tier: string | null
  } | null = null

  if (profile.role === 'buyer') {
    const { data } = await supabase
      .from('buyer_profiles')
      .select('id, company_name, subscription_tier')
      .eq('user_id', user.id)
      .maybeSingle()
    buyerProfile = data
  } else if (profile.role === 'seller') {
    const { data } = await supabase
      .from('seller_profiles')
      .select('id, store_name, is_verified, subscription_tier')
      .eq('user_id', user.id)
      .maybeSingle()
    sellerProfile = data
  }

  const roleLabel =
    profile.role === 'buyer'
      ? 'Alıcı'
      : profile.role === 'seller'
        ? 'Satıcı'
        : 'Kullanıcı'

  const tierLabel =
    profile.role === 'buyer'
      ? buyerProfile?.subscription_tier === 'pro'
        ? 'Pro'
        : buyerProfile?.subscription_tier === 'business'
          ? 'Business'
          : 'Ücretsiz'
      : profile.role === 'seller'
        ? sellerProfile?.subscription_tier === 'pro'
          ? 'Pro'
          : sellerProfile?.subscription_tier === 'enterprise'
            ? 'Enterprise'
            : sellerProfile?.subscription_tier === 'basic'
              ? 'Başlangıç'
              : null
        : null

  const showBuyerOnboarding = profile.role === 'buyer' && !buyerProfile
  const showSellerOnboarding = profile.role === 'seller' && !sellerProfile
  const showSellerPending = profile.role === 'seller' && sellerProfile && !sellerProfile.is_verified

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Hesabım
              </span>
              <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
                {profile.full_name}
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-navy text-white px-2 py-1">
                  {roleLabel}
                </span>
                {tierLabel && (
                  <span className="text-xs font-bold uppercase tracking-wider border border-border text-ink-secondary px-2 py-1">
                    {tierLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profil/duzenle"
                className="border border-border-strong text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors"
              >
                Profili Düzenle
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {showBuyerOnboarding && (
                <div className="border border-state-warning bg-surface-container-lowest p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-navy mb-2">
                    Profil Tamamlanmadı
                  </p>
                  <p className="text-sm text-ink-secondary mb-4 leading-6">
                    Alıcı profilinizi tamamlayarak teklif alma ve sipariş verme özelliklerine erişin.
                  </p>
                  <Link
                    href="/profil/tamamla"
                    className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 inline-flex items-center hover:opacity-90 transition-opacity"
                  >
                    Profili Tamamla →
                  </Link>
                </div>
              )}

              {showSellerOnboarding && (
                <div className="border border-state-warning bg-surface-container-lowest p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-navy mb-2">
                    Satıcı Onboarding
                  </p>
                  <p className="text-sm text-ink-secondary mb-4 leading-6">
                    Mağaza profilinizi oluşturarak satış sürecinizi başlatın.
                  </p>
                  <Link
                    href="/satici/onboarding"
                    className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 inline-flex items-center hover:opacity-90 transition-opacity"
                  >
                    Mağaza Profilini Oluştur →
                  </Link>
                </div>
              )}

              {showSellerPending && (
                <div className="border border-state-warning bg-surface-container-lowest p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-navy mb-2">
                    Doğrulama Bekleniyor
                  </p>
                  <p className="text-sm text-ink-secondary leading-6">
                    Mağaza profiliniz oluşturuldu:{' '}
                    <strong>{sellerProfile?.store_name}</strong>. Satış yapabilmek için
                    ekibimiz tarafından doğrulanması gerekiyor. 24 iş saati içinde
                    bilgilendireceğiz.
                  </p>
                </div>
              )}

              <div className="border border-border bg-surface-container-lowest">
                <div className="p-5 border-b border-border">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                    İletişim Bilgileri
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">
                      E-posta
                    </span>
                    <span className="text-sm text-ink font-medium text-right">{profile.email}</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">
                      Telefon
                    </span>
                    <span className="text-sm font-medium text-right">
                      {profile.phone ? (
                        <span className="text-ink">{profile.phone}</span>
                      ) : (
                        <span className="text-ink-muted italic">Belirtilmemiş</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {buyerProfile && (
                <div className="border border-border bg-surface-container-lowest">
                  <div className="p-5 border-b border-border">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                      Alıcı Bilgileri
                    </h2>
                  </div>
                  <div className="divide-y divide-border">
                    {buyerProfile.company_name && (
                      <div className="px-5 py-4 flex justify-between items-center gap-4">
                        <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">
                          Firma
                        </span>
                        <span className="text-sm text-ink font-medium text-right">
                          {buyerProfile.company_name}
                        </span>
                      </div>
                    )}
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">
                        Üyelik
                      </span>
                      <span className="text-sm text-ink font-medium tabular-nums text-right">
                        {buyerProfile.subscription_tier === 'free'
                          ? 'Ücretsiz'
                          : buyerProfile.subscription_tier === 'pro'
                            ? 'Pro'
                            : 'Business'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 border-t border-border">
                    <Link href="/profil/tamamla" className="text-xs text-navy underline font-medium">
                      Alıcı bilgilerini güncelle
                    </Link>
                  </div>
                </div>
              )}

              {sellerProfile && (
                <div className="border border-border bg-surface-container-lowest">
                  <div className="p-5 border-b border-border flex justify-between items-center">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-navy">
                      Satıcı Mağazası
                    </h2>
                    {sellerProfile.is_verified && (
                      <span className="text-xs font-bold text-state-success uppercase tracking-wider">
                        ✓ Doğrulandı
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">
                        Mağaza Adı
                      </span>
                      <span className="text-sm text-ink font-medium text-right">
                        {sellerProfile.store_name}
                      </span>
                    </div>
                    <div className="px-5 py-4 flex justify-between items-center gap-4">
                      <span className="text-xs text-ink-muted uppercase tracking-wider flex-shrink-0">
                        Üyelik
                      </span>
                      <span className="text-sm text-ink font-medium tabular-nums text-right">
                        {sellerProfile.subscription_tier ?? 'Plan Seçilmedi'}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 border-t border-border">
                    <Link href="/satici/onboarding" className="text-xs text-navy underline font-medium">
                      Mağaza bilgilerini güncelle
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <div className="border border-border bg-surface-container-lowest p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
                  Hızlı Erişim
                </h3>
                <nav className="flex flex-col gap-3">
                  <Link
                    href="/profil/duzenle"
                    className="text-sm text-ink-secondary hover:text-ink transition-colors"
                  >
                    Profili Düzenle
                  </Link>
                  {profile.role === 'buyer' && (
                    <Link
                      href="/profil/tamamla"
                      className="text-sm text-ink-secondary hover:text-ink transition-colors"
                    >
                      Alıcı Bilgilerini Güncelle
                    </Link>
                  )}
                  {profile.role === 'seller' && (
                    <Link
                      href="/satici/onboarding"
                      className="text-sm text-ink-secondary hover:text-ink transition-colors"
                    >
                      Mağaza Ayarları
                    </Link>
                  )}
                  <Link
                    href="/fiyatlar"
                    className="text-sm text-ink-secondary hover:text-ink transition-colors"
                  >
                    Üyelik Planları
                  </Link>
                </nav>
              </div>

              <div className="border border-border bg-surface-container-lowest p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                  Yasal
                </h3>
                <nav className="flex flex-col gap-2">
                  <Link href="/yasal/kvkk" className="text-xs text-ink-muted hover:text-ink transition-colors">
                    KVKK Aydınlatma Metni
                  </Link>
                  <Link href="/yasal/gizlilik" className="text-xs text-ink-muted hover:text-ink transition-colors">
                    Gizlilik Politikası
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
