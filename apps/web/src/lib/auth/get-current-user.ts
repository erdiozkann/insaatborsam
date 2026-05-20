// apps/web/src/lib/auth/get-current-user.ts
// Sunucu tarafında oturumu doğrulayarak mevcut kullanıcıyı döner.
// getUser() kullanılır (getSession() değil) — JWT sunucu tarafında doğrulanır,
// sahte cookie ile kandırılma riski yoktur.

import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Mevcut oturumu sunucu tarafında doğrular.
 * Oturum yoksa veya geçersizse `null` döner.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}
