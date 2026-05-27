import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Alıcı Paneli | İnşaat Borsam',
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
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

  const { data: recentRfqs } = await supabase
    .from('rfqs')
    .select('id, title, status, offer_count, created_at')
    .eq('buyer_id', buyerProfile.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const tierLabel =
    buyerProfile.subscription_tier === 'pro'
      ? 'Pro'
      : buyerProfile.subscription_tier === 'business'
        ? 'Business'
        : 'Ücretsiz'

  return (
    <>
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
                href="/alici/rfq/yeni"
                className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:opacity-90 transition-opacity"
              >
                + Yeni Teklif Talebi
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

          {/* Son Teklif Talepleri */}
          <div className="border border-border bg-surface-container-lowest mb-8">
            <div className="bg-surface-container px-5 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Son Teklif Taleplerim</h3>
              <Link
                href="/alici/rfq"
                className="text-xs text-navy underline font-medium"
              >
                Tümünü Gör
              </Link>
            </div>

            {!recentRfqs || recentRfqs.length === 0 ? (
              <div className="p-8 flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-ink-muted leading-6">
                  Henüz teklif talebi oluşturmadınız.
                </p>
                <Link
                  href="/alici/rfq/yeni"
                  className="bg-brand text-navy font-bold text-sm uppercase tracking-wider px-5 py-2 hover:opacity-90 transition-opacity"
                >
                  İlk Talebi Oluştur →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentRfqs.map((rfq) => (
                  <Link
                    key={rfq.id}
                    href={`/alici/rfq/${rfq.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-container transition-colors group"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-bold text-ink group-hover:text-navy transition-colors truncate">
                        {rfq.title}
                      </span>
                      <span className="text-xs text-ink-muted">{formatDate(rfq.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {rfq.offer_count > 0 && (
                        <span className="text-xs font-bold text-state-success tabular-nums">
                          {rfq.offer_count} Teklif
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${statusClass(rfq.status)}`}
                      >
                        {STATUS_LABELS[rfq.status] ?? rfq.status}
                      </span>
                    </div>
                  </Link>
                ))}
                <div className="px-5 py-3">
                  <Link href="/alici/rfq" className="text-xs text-navy underline font-medium">
                    Tüm talepleri görüntüle →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Alt bilgi */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
