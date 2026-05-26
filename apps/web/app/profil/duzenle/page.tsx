import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { ProfileEditForm } from './ProfileEditForm'

export const metadata: Metadata = {
  title: 'Profili Düzenle | İnşaat Borsam',
  robots: { index: false },
}

export default async function ProfilDuzenlePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/giris?redirect=/profil/duzenle')

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, consent_marketing')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/profil')
  }

  const initialValues = {
    full_name: profile.full_name,
    phone: profile.phone,
    consent_marketing: profile.consent_marketing,
  }

  return (
    <>
      <section className="bg-surface border-b border-border py-10">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-2">
            Hesabım
          </span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-[36px]">
            Profili Düzenle
          </h1>
          <p className="text-sm text-ink-secondary mt-2 leading-6">
            Ad, telefon ve bildirim tercihlerinizi güncelleyin.
          </p>
        </div>
      </section>

      <section className="bg-surface py-10 md:py-16">
        <div className="w-full max-w-container mx-auto px-5 md:px-12">
          <div className="max-w-lg">
            <ProfileEditForm initialValues={initialValues} />
          </div>
        </div>
      </section>
    </>
  )
}
