'use server'

// Sprint 9 — Admin write aksiyonları.
// Güvenlik TAMAMEN SECURITY DEFINER RPC'lerde (has_staff_role(['owner','admin']) içeride zorunlu):
//   - admin_set_seller_verification(p_seller_id, p_verified)
//   - admin_invite_seller_to_rfq(p_rfq_id, p_seller_id)
// Client'tan yalnızca id'ler gelir; is_verified bool SABİT (iki ayrı action true/false çağırır).
// Staff olmayan çağrı RPC tarafından reddedilir → action sessiz/güvenli no-op olur.
// service_role kullanılmaz; getSession kullanılmaz.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function applyVerification(sellerId: string, verified: boolean): Promise<void> {
  if (!UUID_RE.test(sellerId)) return
  const supabase = await createClient()
  // Hata (yetkisiz / bulunamadı) → durum değişmez; detay/PII sızdırılmaz, log yok.
  await supabase.rpc('admin_set_seller_verification', {
    p_seller_id: sellerId,
    p_verified: verified,
  })
  revalidatePath('/admin/saticilar')
}

export async function verifySellerAction(sellerId: string): Promise<void> {
  await applyVerification(sellerId, true)
}

export async function unverifySellerAction(sellerId: string): Promise<void> {
  await applyVerification(sellerId, false)
}

export async function inviteSellerToRfqAction(rfqId: string, sellerId: string): Promise<void> {
  if (!UUID_RE.test(rfqId) || !UUID_RE.test(sellerId)) return
  const supabase = await createClient()
  // Duplicate-safe RPC; staff dışı çağrı reddedilir. Hata güvenli yutulur.
  await supabase.rpc('admin_invite_seller_to_rfq', {
    p_rfq_id: rfqId,
    p_seller_id: sellerId,
  })
  revalidatePath(`/admin/rfq/${rfqId}`)
}
