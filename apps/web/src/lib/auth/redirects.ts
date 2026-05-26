// apps/web/src/lib/auth/redirects.ts
// Merkezi auth redirect yardımcısı.
// Kullanıcının role + profil/onboarding durumuna göre hedef route belirler.
// DB sorgusu yapıldığından sadece server context'te çağrılabilir.
// Tüm hatalar /profil fallback ile kapatılır — hiçbir zaman throw etmez.

import { createClient } from '@/lib/supabase/server'

/**
 * Güvenli yerel path doğrulaması. Open redirect önleme.
 */
export function isLocalPath(path: string): boolean {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

/**
 * Kullanıcının role + onboarding durumuna göre post-login hedef route.
 * DB'den role okunur — client payload'a güvenilmez.
 */
export async function getPostLoginRedirect(userId: string): Promise<string> {
  try {
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (!profile) return '/profil'

    switch (profile.role) {
      case 'buyer': {
        const { data: buyerProfile } = await supabase
          .from('buyer_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        return buyerProfile ? '/alici/panel' : '/profil/tamamla'
      }

      case 'seller': {
        const { data: sellerProfile } = await supabase
          .from('seller_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        if (!sellerProfile) return '/satici/onboarding'
        return '/satici/panel'
      }

      case 'staff':
        return '/admin'

      default:
        return '/profil'
    }
  } catch {
    return '/profil'
  }
}

/**
 * Role'e göre ana panel route. Senkron — DB sorgusu yok.
 */
export function getDashboardRoute(role: string): string {
  switch (role) {
    case 'buyer':
      return '/alici/panel'
    case 'seller':
      return '/satici/panel'
    case 'staff':
      return '/admin'
    default:
      return '/profil'
  }
}

/**
 * Role'e göre onboarding route. Senkron — DB sorgusu yok.
 */
export function getOnboardingRoute(role: string): string {
  switch (role) {
    case 'buyer':
      return '/profil/tamamla'
    case 'seller':
      return '/satici/onboarding'
    default:
      return '/profil'
  }
}
