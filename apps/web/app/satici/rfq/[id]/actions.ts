'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getSellerProfileForCurrentUser } from '@/lib/seller/guards'

export type OfferCreateState = {
  error?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Para güvenlik sınırı: max ₺100.000.000 = 10_000_000_000 cent.
const MAX_UNIT_PRICE_CENTS = 10_000_000_000

const offerSchema = z.object({
  unit_price_cents: z
    .number()
    .int('Birim fiyat geçerli değil.')
    .positive('Birim fiyat 0\'dan büyük olmalı.')
    .max(MAX_UNIT_PRICE_CENTS, 'Birim fiyat çok yüksek.'),
  delivery_time_days: z
    .number()
    .int('Teslimat süresi tam gün olmalı.')
    .min(1, 'Teslimat süresi en az 1 gün olmalı.')
    .max(365, 'Teslimat süresi en fazla 365 gün olabilir.'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Not en fazla 1000 karakter olabilir.')
    .nullable()
    .optional(),
})

/**
 * Satıcının bir RFQ'ya teklif vermesi.
 * Güvenlik:
 *   - rfqId route param'dan gelir ama sunucuda doğrulanır (uuid + erişim + status).
 *   - seller_id client'tan ALINMAZ — getSellerProfileForCurrentUser ile bulunur.
 *   - total_price_cents sunucuda rfqs.quantity ile hesaplanır.
 *   - status/resulting_order_id/created_at/updated_at client'tan ALINMAZ.
 *   - Davet + RLS kontrolü DB tarafında zorunlu (rfq_offers_insert_invited_seller).
 */
export async function createOfferAction(
  rfqId: string,
  _prevState: OfferCreateState,
  formData: FormData,
): Promise<OfferCreateState> {
  if (typeof rfqId !== 'string' || !UUID_RE.test(rfqId)) {
    return { error: 'Geçersiz teklif talebi.' }
  }

  const ctx = await getSellerProfileForCurrentUser()
  if (!ctx) {
    redirect(`/giris?redirect=${encodeURIComponent(`/satici/rfq/${rfqId}`)}`)
  }

  if (!ctx.sellerProfile.isVerified) {
    return {
      error: 'Hesabınız doğrulanana kadar teklif veremezsiniz. Doğrulama tamamlanınca bilgilendirileceksiniz.',
    }
  }

  // Birim fiyat TRY girilir; sunucuda cent'e çevrilir (float para yok).
  const rawUnitPrice = String(formData.get('unit_price') ?? '').replace(',', '.').trim()
  const rawDeliveryDays = String(formData.get('delivery_time_days') ?? '').trim()
  const rawNotes = String(formData.get('notes') ?? '').trim()

  const unitPriceTry = parseFloat(rawUnitPrice)
  const deliveryDays = parseInt(rawDeliveryDays, 10)

  const parsed = offerSchema.safeParse({
    unit_price_cents:
      Number.isFinite(unitPriceTry) ? Math.round(unitPriceTry * 100) : NaN,
    delivery_time_days: Number.isFinite(deliveryDays) ? deliveryDays : NaN,
    notes: rawNotes.length > 0 ? rawNotes : null,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Bilgileri kontrol edin.' }
  }

  const supabase = await createClient()

  // RFQ sunucu tarafında okunur. RLS yalnızca davetli satıcıya döndürür —
  // erişim yoksa null gelir (IDOR koruması).
  const { data: rfq } = await supabase
    .from('rfqs')
    .select('id, status, quantity, deleted_at')
    .eq('id', rfqId)
    .maybeSingle()

  if (!rfq || rfq.deleted_at) {
    return { error: 'Bu teklif talebine erişiminiz yok veya talep kaldırılmış.' }
  }

  if (rfq.status !== 'open') {
    return { error: 'Bu talep artık tekliflere açık değil.' }
  }

  // Aynı satıcı aynı RFQ'ya tek teklif verebilir (DB UNIQUE garantisi + ön kontrol).
  const { data: existingOffer } = await supabase
    .from('rfq_offers')
    .select('id')
    .eq('rfq_id', rfqId)
    .eq('seller_id', ctx.sellerProfile.id)
    .maybeSingle()

  if (existingOffer) {
    return { error: 'Bu talep için zaten teklif verdiniz.' }
  }

  // total = birim fiyat (cent) × ana miktar. quantity NUMERIC(12,2) → kesirli olabilir.
  const totalPriceCents = Math.round(parsed.data.unit_price_cents * rfq.quantity)

  if (!Number.isFinite(totalPriceCents) || totalPriceCents <= 0) {
    return { error: 'Toplam tutar hesaplanamadı. Birim fiyatı kontrol edin.' }
  }

  const { error: insertError } = await supabase.from('rfq_offers').insert({
    rfq_id: rfqId,
    seller_id: ctx.sellerProfile.id,
    unit_price_cents: parsed.data.unit_price_cents,
    total_price_cents: totalPriceCents,
    delivery_time_days: parsed.data.delivery_time_days,
    notes: parsed.data.notes ?? null,
  })

  if (insertError) {
    // Yarış durumu: ikinci eşzamanlı teklif unique constraint'e takılır.
    if (insertError.code === '23505') {
      return { error: 'Bu talep için zaten teklif verdiniz.' }
    }
    // RLS reddi (davet yok / status değişti) veya başka hata — detay sızdırılmaz.
    return { error: 'Teklif gönderilemedi. Lütfen tekrar deneyin.' }
  }

  redirect(`/satici/rfq/${rfqId}`)
}
