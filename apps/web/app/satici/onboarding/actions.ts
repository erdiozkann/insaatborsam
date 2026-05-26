'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export type SellerOnboardingState = {
  error?: string
}

const SELLER_COMPANY_TYPES = ['nalbur', 'toptan', 'bayi', 'distributor', 'uretici'] as const

function generateSlug(name: string): string {
  const turkishMap: Record<string, string> = {
    ş: 's', Ş: 's', ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g',
    ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u',
  }
  return name
    .split('')
    .map((c) => turkishMap[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

const schema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, 'Firma adı en az 2 karakter olmalı')
    .max(200, 'Firma adı en fazla 200 karakter olabilir'),
  company_type: z.enum(SELLER_COMPANY_TYPES, {
    message: 'Geçerli bir firma türü seçin',
  }),
  tax_id: z
    .string()
    .trim()
    .regex(/^[0-9]{10,11}$/, 'Vergi numarası 10 veya 11 haneli olmalıdır'),
  trade_registry_no: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  store_name: z
    .string()
    .trim()
    .min(2, 'Mağaza adı en az 2 karakter olmalı')
    .max(200, 'Mağaza adı en fazla 200 karakter olabilir'),
  store_slug: z
    .string()
    .trim()
    .min(2, 'Mağaza adresi en az 2 karakter olmalı')
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      'Mağaza adresi sadece küçük harf, rakam ve tire (-) içerebilir',
    ),
  store_description: z
    .string()
    .trim()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  primary_city: z
    .string()
    .trim()
    .min(2, 'Şehir en az 2 karakter olmalı')
    .max(100),
  primary_district: z
    .string()
    .trim()
    .min(2, 'İlçe en az 2 karakter olmalı')
    .max(100),
  service_areas_raw: z
    .string()
    .trim()
    .optional()
    .transform((v) => {
      if (!v || v.length === 0) return []
      return v
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }),
})

export async function sellerOnboardingAction(
  _prevState: SellerOnboardingState,
  formData: FormData,
): Promise<SellerOnboardingState> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Oturum geçersiz. Lütfen yeniden giriş yapın.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'seller') {
    return { error: 'Bu sayfa sadece satıcı hesaplar içindir.' }
  }

  const rawSlug = String(formData.get('store_slug') ?? '').trim()
  const rawStoreName = String(formData.get('store_name') ?? '').trim()
  const resolvedSlug = rawSlug.length > 0 ? rawSlug : generateSlug(rawStoreName)

  const parsed = schema.safeParse({
    company_name: String(formData.get('company_name') ?? '').trim(),
    company_type: String(formData.get('company_type') ?? '').trim(),
    tax_id: String(formData.get('tax_id') ?? '').trim(),
    trade_registry_no: String(formData.get('trade_registry_no') ?? '').trim(),
    store_name: rawStoreName,
    store_slug: resolvedSlug,
    store_description: String(formData.get('store_description') ?? '').trim(),
    primary_city: String(formData.get('primary_city') ?? '').trim(),
    primary_district: String(formData.get('primary_district') ?? '').trim(),
    service_areas_raw: String(formData.get('service_areas') ?? '').trim(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Bilgileri kontrol edin.' }
  }

  const { data: existing } = await supabase
    .from('seller_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    const { error: insertError } = await supabase.from('seller_profiles').insert({
      user_id: user.id,
      company_name: parsed.data.company_name,
      company_type: parsed.data.company_type,
      tax_id: parsed.data.tax_id,
      trade_registry_no: parsed.data.trade_registry_no,
      store_name: parsed.data.store_name,
      store_slug: parsed.data.store_slug,
      store_description: parsed.data.store_description,
      primary_city: parsed.data.primary_city,
      primary_district: parsed.data.primary_district,
      service_areas: parsed.data.service_areas_raw,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        if (insertError.message.includes('store_slug')) {
          return {
            error:
              'Bu mağaza adresi zaten kullanılıyor. Lütfen farklı bir mağaza adresi girin.',
          }
        }
        if (insertError.message.includes('tax_id')) {
          return {
            error: 'Bu vergi numarasıyla zaten bir satıcı hesabı kayıtlı.',
          }
        }
      }
      return { error: 'Mağaza profili kaydedilemedi. Lütfen tekrar deneyin.' }
    }
  } else {
    const { error: updateError } = await supabase
      .from('seller_profiles')
      .update({
        company_name: parsed.data.company_name,
        company_type: parsed.data.company_type,
        tax_id: parsed.data.tax_id,
        trade_registry_no: parsed.data.trade_registry_no,
        store_name: parsed.data.store_name,
        store_slug: parsed.data.store_slug,
        store_description: parsed.data.store_description,
        primary_city: parsed.data.primary_city,
        primary_district: parsed.data.primary_district,
        service_areas: parsed.data.service_areas_raw,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      if (updateError.code === '23505') {
        if (updateError.message.includes('store_slug')) {
          return {
            error:
              'Bu mağaza adresi zaten kullanılıyor. Lütfen farklı bir mağaza adresi girin.',
          }
        }
      }
      return { error: 'Mağaza profili güncellenemedi. Lütfen tekrar deneyin.' }
    }
  }

  redirect('/profil')
}
