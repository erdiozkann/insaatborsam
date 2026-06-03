// apps/web/src/lib/admin/guards.ts
// Admin (staff) sayfaları için sunucu tarafı guard.
// Kurallar:
//   - getUser() ile JWT sunucuda doğrulanır (getSession() değil).
//   - Staff doğrulaması staff_users tablosundan okunur (RLS self-select: user_id = auth.uid()).
//     is_active = TRUE ve deleted_at IS NULL zorunlu. Aktif staff değilse erişim yok.
//   - service_role kullanılmaz; tüm sorgular RLS'e tabidir.
//   - Rol adı (roles.name) yetki kararları için döndürülür (örn. owner/admin write aksiyonları).

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type StaffContext = {
  user: User
  staffUserId: string
  roleName: string
  roleDisplayName: string
}

/**
 * Mevcut kullanıcıyı aktif staff olarak doğrular.
 * Redirect kuralları:
 *   - Oturum yok        → /giris?redirect=<path>
 *   - Aktif staff değil → /profil
 */
export async function requireStaff(currentPath: string): Promise<StaffContext> {
  const user = await getCurrentUser()
  if (!user) redirect(`/giris?redirect=${encodeURIComponent(currentPath)}`)

  const supabase = await createClient()

  // RLS staff_users_select_own: yalnızca kendi staff kaydını döndürür.
  // roles embed: roles_staff_read_all (is_active_staff) — aktif staff için erişilir.
  const { data: staff } = await supabase
    .from('staff_users')
    .select('id, is_active, roles(name, display_name)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!staff || !staff.is_active || !staff.roles) redirect('/profil')

  return {
    user,
    staffUserId: staff.id,
    roleName: staff.roles.name,
    roleDisplayName: staff.roles.display_name,
  }
}

/** owner/admin yetkisi gerektiren write aksiyonları için yardımcı (UI gösterim kararı). */
export function canManage(roleName: string): boolean {
  return roleName === 'owner' || roleName === 'admin'
}
