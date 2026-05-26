import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { SellerOnboardingForm } from './SellerOnboardingForm'

export const metadata: Metadata = {
  title: 'Satıcı Profili | İnşaat Borsam',
  robots: { index: false },
}

export default async function SellerOnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/giris?redirect=/satici/onboarding')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'seller') {
    redirect('/profil')
  }

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select(
      'company_name, company_type, tax_id, trade_registry_no, store_name, store_slug, store_description, primary_city, primary_district, service_areas, is_verified',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  const isExisting = !!sellerProfile

  const initialValues = {
    company_name: sellerProfile?.company_name ?? '',
    company_type: sellerProfile?.company_type ?? '',
    tax_id: sellerProfile?.tax_id ?? '',
    trade_registry_no: sellerProfile?.trade_registry_no ?? null,
    store_name: sellerProfile?.store_name ?? '',
    store_slug: sellerProfile?.store_slug ?? '',
    store_description: sellerProfile?.store_description ?? null,
    primary_city: sellerProfile?.primary_city ?? '',
    primary_district: sellerProfile?.primary_district ?? '',
    service_areas: sellerProfile?.service_areas ?? [],
  }

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
            Satıcı Hesabı
          </span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
            {isExisting ? 'Mağaza Bilgilerini Güncelle' : 'Mağaza Profili Oluştur'}
          </h1>
          <p className="text-sm text-ink-secondary mt-2 leading-6 max-w-lg">
            {isExisting
              ? 'Mağaza bilgilerinizi güncelleyin. Doğrulama durumunuz değişmez.'
              : 'Satıcı profilinizi tamamlayın. Doğrulama sonrası satışa başlayabilirsiniz.'}
          </p>
        </div>
      </section>

      {sellerProfile && !sellerProfile.is_verified && (
        <div className="bg-surface-container-low border-b border-border">
          <div className="w-full max-w-container mx-auto px-5 md:px-12 py-4">
            <p className="text-sm text-ink-secondary">
              <span className="font-bold text-state-warning">Doğrulama bekleniyor —</span>{' '}
              Ekibimiz 24 iş saati içinde sizinle iletişime geçecek.
            </p>
          </div>
        </div>
      )}

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <SellerOnboardingForm
                initialValues={initialValues}
                isExisting={isExisting}
              />
            </div>

            <aside className="flex flex-col gap-4">
              <div className="border border-border bg-surface-container-lowest p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
                  Satıcı Avantajları
                </h2>
                <ul className="flex flex-col gap-3">
                  {[
                    'Doğrulanmış alıcılara erişim',
                    'Dijital RFQ inbox',
                    'Otomatik sipariş akışı',
                    'İlk 3 ay komisyonsuz',
                    '24 saat içinde aktivasyon',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-ink-secondary">
                      <span className="text-state-success font-bold flex-shrink-0 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-border bg-surface-container-lowest p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">
                  Sonraki Adımlar
                </h2>
                <ol className="flex flex-col gap-3">
                  {[
                    { step: '01', label: 'Profil oluştur', done: isExisting },
                    { step: '02', label: 'Ekip doğrulaması', done: sellerProfile?.is_verified ?? false },
                    { step: '03', label: 'Plan seç & öde', done: false },
                    { step: '04', label: 'Satışa başla', done: false },
                  ].map(({ step, label, done }) => (
                    <li key={step} className="flex items-center gap-3 text-sm">
                      <span
                        className={`text-xs font-bold tabular-nums flex-shrink-0 ${done ? 'text-state-success' : 'text-brand-dark'}`}
                      >
                        {step}
                      </span>
                      <span className={done ? 'text-state-success line-through' : 'text-ink-secondary'}>
                        {label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
