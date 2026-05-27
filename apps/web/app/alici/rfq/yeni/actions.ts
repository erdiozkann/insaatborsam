'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireBuyer } from '@/lib/rfq/guards'

export type RfqCreateState = {
  error?: string
}

const UNIT_VALUES = ['m2', 'm3', 'metre', 'ton', 'kg', 'adet', 'paket', 'kutu', 'litre', 'cuval'] as const

const rfqItemSchema = z.object({
  material_name: z
    .string()
    .trim()
    .min(2, 'Malzeme adı en az 2 karakter olmalı')
    .max(200, 'Malzeme adı en fazla 200 karakter olabilir'),
  quantity: z.number().positive('Malzeme miktarı 0\'dan büyük olmalı'),
  unit: z.enum(UNIT_VALUES, { message: 'Geçerli bir birim seçin' }),
  notes: z.string().trim().max(500, 'Not en fazla 500 karakter olabilir').nullable().optional(),
})

const rfqSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Başlık en az 3 karakter olmalı')
    .max(300, 'Başlık en fazla 300 karakter olabilir'),
  description: z
    .string()
    .trim()
    .min(10, 'Açıklama en az 10 karakter olmalı')
    .max(2000, 'Açıklama en fazla 2000 karakter olabilir'),
  quantity: z.number().positive('Ana miktar 0\'dan büyük olmalı'),
  unit: z.enum(UNIT_VALUES, { message: 'Geçerli bir birim seçin' }),
  delivery_deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih girin'),
  category_id: z.string().uuid().nullable().optional(),
  estimated_budget_cents: z.number().int().positive().nullable().optional(),
  items: z
    .array(rfqItemSchema)
    .min(1, 'En az 1 malzeme kalemi ekleyin')
    .max(20, 'En fazla 20 malzeme kalemi eklenebilir'),
})

export async function createRfqAction(
  _prevState: RfqCreateState,
  formData: FormData,
): Promise<RfqCreateState> {
  const { buyerProfileId } = await requireBuyer('/alici/rfq/yeni')

  const rawTitle = String(formData.get('title') ?? '').trim()
  const rawDescription = String(formData.get('description') ?? '').trim()
  const rawQuantity = String(formData.get('quantity') ?? '').replace(',', '.')
  const rawUnit = String(formData.get('unit') ?? '')
  const rawDeadline = String(formData.get('delivery_deadline') ?? '')
  const rawCategoryId = String(formData.get('category_id') ?? '').trim()
  const rawBudget = String(formData.get('estimated_budget') ?? '').trim()
  const rawItemsJson = String(formData.get('items_json') ?? '[]')

  let rawItems: unknown
  try {
    rawItems = JSON.parse(rawItemsJson)
  } catch {
    return { error: 'Malzeme listesi okunamadı. Sayfayı yenileyip tekrar deneyin.' }
  }

  const quantityNum = parseFloat(rawQuantity)
  const budgetCents = rawBudget ? Math.round(parseFloat(rawBudget.replace(',', '.')) * 100) : null
  const categoryId = rawCategoryId && rawCategoryId.length === 36 ? rawCategoryId : null

  const parsed = rfqSchema.safeParse({
    title: rawTitle,
    description: rawDescription,
    quantity: isNaN(quantityNum) ? 0 : quantityNum,
    unit: rawUnit,
    delivery_deadline: rawDeadline,
    category_id: categoryId,
    estimated_budget_cents: budgetCents && !isNaN(budgetCents) ? budgetCents : null,
    items: rawItems,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Bilgileri kontrol edin.' }
  }

  const today = new Date().toISOString().slice(0, 10)
  if (parsed.data.delivery_deadline < today) {
    return { error: 'Teslimat tarihi bugün veya daha sonrası olmalıdır.' }
  }

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const supabase = await createClient()

  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .insert({
      buyer_id: buyerProfileId,
      title: parsed.data.title,
      description: parsed.data.description,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      delivery_deadline: parsed.data.delivery_deadline,
      expires_at: expiresAt,
      category_id: parsed.data.category_id ?? null,
      estimated_budget_cents: parsed.data.estimated_budget_cents ?? null,
    })
    .select('id')
    .single()

  if (rfqError || !rfq) {
    return { error: 'Teklif talebi oluşturulamadı. Lütfen tekrar deneyin.' }
  }

  const itemsToInsert = parsed.data.items.map((item, i) => ({
    rfq_id: rfq.id,
    material_name: item.material_name,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes ?? null,
    display_order: i,
  }))

  const { error: itemsError } = await supabase.from('rfq_items').insert(itemsToInsert)

  if (itemsError) {
    // Soft-delete orphaned rfq — buyer UPDATE policy allows this
    await supabase
      .from('rfqs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', rfq.id)
    return { error: 'Malzeme kalemleri kaydedilemedi. Lütfen tekrar deneyin.' }
  }

  redirect(`/alici/rfq/${rfq.id}`)
}
