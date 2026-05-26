import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { ProfileCompleteForm } from './ProfileCompleteForm'

export const metadata: Metadata = {
  title: 'Profil Tamamla | İnşaat Borsam',
  robots: { index: false },
}

export default async function ProfilTamamlaPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/giris?redirect=/profil/tamamla')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'buyer') {
    redirect('/profil')
  }

  const { data: buyerProfile } = await supabase
    .from('buyer_profiles')
    .select('company_name, company_type, tax_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const initialValues = {
    company_name: buyerProfile?.company_name ?? null,
    company_type: buyerProfile?.company_type ?? null,
    tax_id: buyerProfile?.tax_id ?? null,
  }

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
            Hesabım
          </span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
            {buyerProfile ? 'Alıcı Bilgilerini Güncelle' : 'Profili Tamamla'}
          </h1>
          <p className="text-sm text-ink-secondary mt-2 leading-6 max-w-lg">
            Alıcı bilgilerinizi girerek sistemi daha verimli kullanabilirsiniz. Tüm alanlar
            isteğe bağlıdır.
          </p>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <ProfileCompleteForm initialValues={initialValues} />
            </div>

            <aside className="flex flex-col gap-4">
              <div className="border border-border bg-surface-container-lowest p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
                  Neden Doldurayım?
                </h2>
                <ul className="flex flex-col gap-3">
                  {[
                    'Teklif taleplerinde firma bilginiz görünür',
                    'Satıcılar size daha hızlı yanıt verir',
                    'Fatura kesilebilir vergi kaydı',
                    'Kargo ve teslimat adres eşleşmesi',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-ink-secondary">
                      <span className="text-state-success font-bold flex-shrink-0 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
