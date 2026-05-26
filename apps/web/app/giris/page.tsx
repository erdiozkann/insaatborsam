import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { GirisForm } from './GirisForm'

export const metadata: Metadata = {
  title: 'Giriş Yap',
  description: 'İnşaat Borsam hesabınıza SMS ile giriş yapın veya yeni hesap oluşturun.',
  robots: { index: false },
}

type Props = {
  searchParams: Promise<{ redirect?: string; error?: string }>
}

export default async function GirisPage({ searchParams }: Props) {
  const { redirect: redirectTo, error } = await searchParams

  const user = await getCurrentUser()
  if (user) {
    const dest =
      redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/profil'
    redirect(dest)
  }

  const safeRedirect =
    redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/profil'

  return (
    <section className="min-h-[80vh] bg-surface flex items-center justify-center py-16 px-5">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block mb-3">
            Hesabınıza erişin
          </span>
          <h1 className="text-[32px] font-extrabold tracking-tight text-ink leading-[40px]">
            Giriş Yap
          </h1>
          <p className="text-sm text-ink-secondary mt-2 leading-6">
            Telefon numaranıza SMS doğrulama kodu göndereceğiz.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="border border-state-error bg-surface-container p-4 mb-6"
          >
            <p className="text-sm text-state-error font-medium">
              {error === 'missing_code' && 'Geçersiz giriş bağlantısı.'}
              {error === 'auth_callback' &&
                'Oturum açılırken hata oluştu. Lütfen tekrar deneyin.'}
              {error !== 'missing_code' &&
                error !== 'auth_callback' &&
                'Giriş yapılamadı. Lütfen tekrar deneyin.'}
            </p>
          </div>
        )}

        <GirisForm redirectTo={safeRedirect} />
      </div>
    </section>
  )
}
