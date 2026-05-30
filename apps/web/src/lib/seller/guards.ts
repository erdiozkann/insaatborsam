// apps/web/src/lib/seller/guards.ts
// Satıcı sayfaları ve teklif akışı için sunucu tarafı guard'lar.
// Kurallar:
//   - getUser() ile JWT sunucuda doğrulanır (getSession() değil).
//   - role DB'den okunur — client payload'a güvenilmez.
//   - seller_profiles.id sunucu tarafında bulunur — client'tan seller_id kabul edilmez.
//   - service_role kullanılmaz; tüm sorgular RLS'e tabidir.
//   - Doğrulama (is_verified) durumu çağırana bırakılır; sayfalar pending ekranını
//     inline gösterir (redirect döngüsü riskini önlemek için).

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type SellerProfileSummary = {
  id: string
  storeName: string
  isVerified: boolean
}

export type SellerContext = {
  user: User
  sellerProfile: SellerProfileSummary
}

/**
 * Mevcut kullanıcıyı satıcı olarak doğrular ve seller_profiles kaydını döner.
 * Redirect kuralları:
 *   - Oturum yok       → /giris?redirect=<path>
 *   - Satıcı değil     → /profil
 *   - Profil yok       → /satici/onboarding
 * Doğrulama (is_verified) durumu KONTROL EDİLMEZ — çağıran karar verir.
 */
export async function requireSellerProfile(currentPath: string): Promise<SellerContext> {
  const user = await getCurrentUser()
  if (!user) redirect(`/giris?redirect=${encodeURIComponent(currentPath)}`)

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'seller') redirect('/profil')

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('id, store_name, is_verified')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sellerProfile) redirect('/satici/onboarding')

  return {
    user,
    sellerProfile: {
      id: sellerProfile.id,
      storeName: sellerProfile.store_name,
      isVerified: sellerProfile.is_verified,
    },
  }
}

/**
 * Redirect ETMEYEN varyant — server action'larda kullanılır.
 * Satıcı bağlamı kurulamazsa (oturum yok / satıcı değil / profil yok) `null` döner.
 * Doğrulama durumu `sellerProfile.isVerified` üzerinden çağıran tarafından kontrol edilir.
 */
export async function getSellerProfileForCurrentUser(): Promise<SellerContext | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'seller') return null

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('id, store_name, is_verified')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sellerProfile) return null

  return {
    user,
    sellerProfile: {
      id: sellerProfile.id,
      storeName: sellerProfile.store_name,
      isVerified: sellerProfile.is_verified,
    },
  }
}
