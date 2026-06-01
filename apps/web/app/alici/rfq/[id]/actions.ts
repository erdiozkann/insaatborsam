'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Sprint 6.1 — Alıcı teklif lifecycle aksiyonları.
// Güvenlik TAMAMEN set_rfq_offer_status RPC'sinde (SECURITY DEFINER):
//   - auth.uid() → buyer_profiles eşleşmesi (satıcı/anon engellenir)
//   - RFQ ownership (başka alıcının teklifi reddedilir)
//   - p_next_status whitelist (shortlisted/rejected/accepted_pending_order)
//   - yalnızca status + updated_at güncellenir; seller_id/fiyat/resulting_order_id dokunulmaz
// Burada client'tan SADECE offer_id + rfq_id (route bağlamı) alınır; status sabittir.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type NextStatus = 'shortlisted' | 'rejected' | 'accepted_pending_order'

async function setOfferStatus(offerId: string, rfqId: string, nextStatus: NextStatus): Promise<void> {
  if (!UUID_RE.test(offerId) || !UUID_RE.test(rfqId)) return

  const supabase = await createClient()

  // Hata (yetkisiz / bulunamadı / geçersiz) → durum değişmez. Detay sızdırılmaz, PII log yok.
  await supabase.rpc('set_rfq_offer_status', {
    p_offer_id: offerId,
    p_next_status: nextStatus,
  })

  revalidatePath(`/alici/rfq/${rfqId}`)
}

export async function shortlistOfferAction(offerId: string, rfqId: string): Promise<void> {
  await setOfferStatus(offerId, rfqId, 'shortlisted')
}

export async function rejectOfferAction(offerId: string, rfqId: string): Promise<void> {
  await setOfferStatus(offerId, rfqId, 'rejected')
}

export async function acceptOfferPendingAction(offerId: string, rfqId: string): Promise<void> {
  await setOfferStatus(offerId, rfqId, 'accepted_pending_order')
}

// Sprint 7 — accepted_pending_order teklifinden başlangıç siparişi oluşturma.
// Güvenlik TAMAMEN create_order_from_offer RPC'sinde (SECURITY DEFINER):
//   - auth.uid() → buyer_profiles eşleşmesi (satıcı/anon engellenir)
//   - RFQ ownership (başka alıcının teklifi reddedilir)
//   - offer.status = accepted_pending_order zorunlu
//   - duplicate koruması (resulting_order_id doluysa mevcut sipariş döner, ikinci yaratılmaz)
//   - buyer_id/seller_id/total/status/resulting_order_id server-side türetilir
// Client'tan SADECE offer_id + rfq_id (route bağlamı) alınır. Ödeme YOK.
export async function createOrderFromOfferAction(offerId: string, rfqId: string): Promise<void> {
  if (!UUID_RE.test(offerId) || !UUID_RE.test(rfqId)) return

  const supabase = await createClient()

  // RPC order id döner (veya idempotent: zaten bağlı siparişin id'si).
  const { data: orderId, error } = await supabase.rpc('create_order_from_offer', {
    p_offer_id: offerId,
  })

  // Hata güvenli: durum değişmez, detay/PII sızdırılmaz, log yok. Alıcı RFQ'da kalır.
  if (error || !orderId) {
    revalidatePath(`/alici/rfq/${rfqId}`)
    return
  }

  revalidatePath(`/alici/rfq/${rfqId}`)
  redirect(`/alici/siparis/${orderId}`)
}
