import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type BuyerContext = {
  user: User
  buyerProfileId: string
}

export async function requireBuyer(currentPath: string): Promise<BuyerContext> {
  const user = await getCurrentUser()
  if (!user) redirect(`/giris?redirect=${encodeURIComponent(currentPath)}`)

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'buyer') redirect('/profil')

  const { data: buyerProfile } = await supabase
    .from('buyer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!buyerProfile) redirect('/profil/tamamla')

  return { user, buyerProfileId: buyerProfile.id }
}
