'use server'

import { revalidatePath } from 'next/cache'
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
