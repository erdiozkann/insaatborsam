import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Alıcı Paneli | İnşaat Borsam',
  robots: { index: false },
}

export default async function AliciPanelPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/giris?redirect=/alici/panel')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'buyer') redirect('/profil')

  const { data: buyerProfile } = await supabase
    .from('buyer_profiles')
    .select('id, subscription_tier, company_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!buyerProfile) redirect('/profil/tamamla')

  const tierLabel =
    buyerProfile.subscription_tier === 'pro'
      ? 'Pro'
      : buyerProfile.subscription_tier === 'business'
        ? 'Business'
        : 'Ücretsiz'

  return (
    <>
      {/* Sayfa başlığı */}
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Alıcı Paneli
              </span>
              <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
                Merhaba, {profile.full_name}
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-bold uppercase tracking-wider bg-navy text-white px-2 py-1">
                  Alıcı
                </span>
                <span className="text-xs font-bold uppercase tracking-wider border border-border text-ink-secondary px-2 py-1">
                  {tierLabel}
                </span>
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

          {/* Profil durumu kartı */}
          <div className="border border-state-success bg-surface-container-lowest p-5 mb-8 flex items-center gap-3">
            <span className="text-state-success font-bold text-lg leading-none">✓</span>
            <div>
              <p className="text-sm font-bold text-ink">Alıcı profiliniz tamamlandı.</p>
              {buyerProfile.company_name && (
                <p className="text-xs text-ink-muted mt-0.5">{buyerProfile.company_name}</p>
              )}
            </div>
          </div>

          {/* Placeholder kartlar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Teklif Talebi */}
            <div className="border border-border bg-surface-container-lowest">
              <div className="bg-surface-container px-5 py-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Teklif Talebi Oluştur
                </h3>
              </div>
              <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-3">
                <p className="text-sm text-ink-muted text-center leading-6">
                  Birden fazla satıcıdan aynı anda fiyat teklifi alın.
                </p>
                <span className="text-xs font-bold uppercase tracking-wider border border-border text-ink-muted px-3 py-1">
                  Yakında
                </span>
              </div>
            </div>

            {/* Aktif Talepler */}
            <div className="border border-border bg-surface-container-lowest">
              <div className="bg-surface-container px-5 py-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Aktif Taleplerim
                </h3>
              </div>
              <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-3">
                <p className="text-sm text-ink-muted text-center leading-6">
                  Açık teklif taleplerinizi ve gelen teklifleri buradan takip edeceksiniz.
                </p>
                <span className="text-xs font-bold uppercase tracking-wider border border-border text-ink-muted px-3 py-1">
                  Yakında
                </span>
              </div>
            </div>

            {/* Satıcı Teklifleri */}
            <div className="border border-border bg-surface-container-lowest">
              <div className="bg-surface-container px-5 py-3 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Satıcı Teklifleri
                </h3>
              </div>
              <div className="p-6 flex flex-col items-center justify-center min-h-[140px] gap-3">
                <p className="text-sm text-ink-muted text-center leading-6">
                  Satıcılardan gelen teklifleri karşılaştırıp en uygununu seçin.
                </p>
                <span className="text-xs font-bold uppercase tracking-wider border border-border text-ink-muted px-3 py-1">
                  Yakında
                </span>
              </div>
            </div>

          </div>

          {/* Alt bilgi */}
          <div className="mt-10 border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-ink-muted uppercase tracking-wider font-bold mb-1">
                Üyelik Planınız
              </p>
              <p className="text-sm text-ink">
                {tierLabel === 'Ücretsiz'
                  ? 'Ücretsiz plan — Pro veya Business planına geçerek sınırsız erişim elde edin.'
                  : `${tierLabel} plan aktif.`}
              </p>
            </div>
            <Link
              href="/fiyatlar"
              className="border border-border text-navy font-bold text-xs uppercase tracking-wider px-4 py-2 hover:bg-surface-container transition-colors whitespace-nowrap"
            >
              Üyelik Planları
            </Link>
          </div>

        </div>
      </section>
    </>
  )
}
